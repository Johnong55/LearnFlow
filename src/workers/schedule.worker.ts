import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client';
import type { Job } from 'bullmq';
import { addLocalDays, zonedDateTimeToUtc } from '@/common/utils/timezone.utils';
import {
  SCHEDULE_GENERATION_JOB,
  SCHEDULE_QUEUE,
} from '@/infrastructure/queue/schedule-queue.constants';
import { SchedulingEngine } from '@/modules/scheduling/domain/scheduling.engine';
import type { ScheduleJobData } from '@/modules/scheduling/interfaces/schedule-job.interface';
import { ScheduleJobsRepository } from '@/modules/scheduling/repositories/schedule-jobs.repository';
import { SchedulingRepository } from '@/modules/scheduling/repositories/scheduling.repository';

@Processor(SCHEDULE_QUEUE)
export class ScheduleWorker extends WorkerHost {
  private readonly logger = new Logger(ScheduleWorker.name);

  constructor(
    private readonly repository: SchedulingRepository,
    private readonly jobs: ScheduleJobsRepository,
    private readonly engine: SchedulingEngine,
  ) {
    super();
  }

  async process(job: Job<ScheduleJobData>): Promise<unknown> {
    if (job.name !== SCHEDULE_GENERATION_JOB)
      throw new Error(`Unsupported schedule job: ${job.name}`);
    await this.jobs.running(job.data.backgroundJobId);
    await job.updateProgress(25);
    try {
      const { input, version } = await this.repository.buildInput(
        job.data.userId,
        job.data.roadmapId,
        job.data,
      );
      const plan = this.engine.generate(input);
      await job.updateProgress(75);
      const from = zonedDateTimeToUtc(job.data.from, '00:00', input.timeZone);
      const to = zonedDateTimeToUtc(addLocalDays(job.data.to, 1), '00:00', input.timeZone);
      const persisted = await this.repository.replaceGeneratedPlan(
        job.data.userId,
        job.data.roadmapId,
        from,
        to,
        plan,
        job.data.source,
      );
      const result: Prisma.InputJsonObject = {
        roadmapId: job.data.roadmapId,
        roadmapVersion: version,
        from: job.data.from,
        to: job.data.to,
        ...persisted,
      };
      await this.jobs.complete(job.data.backgroundJobId, result);
      await job.updateProgress(100);
      this.logger.log(
        `Generated ${persisted.scheduledSessions} sessions for ${job.data.roadmapId}`,
      );
      return result;
    } catch (error) {
      const attempts = Number(job.opts.attempts ?? 1);
      if (job.attemptsMade + 1 >= attempts) {
        await this.jobs.fail(
          job.data.backgroundJobId,
          error instanceof Error
            ? error.message.slice(0, 2000)
            : 'Unknown schedule generation error.',
        );
      }
      throw error;
    }
  }
}
