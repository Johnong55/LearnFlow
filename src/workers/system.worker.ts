import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ReschedulingMode } from '@prisma/client';
import type { Job } from 'bullmq';
import { ADAPTIVE_DAILY_JOB, SYSTEM_QUEUE } from '@/infrastructure/queue/queue.constants';
import { ProgressService } from '@/modules/progress/services/progress.service';
import { AdaptiveSchedulingRepository } from '@/modules/scheduling/repositories/adaptive-scheduling.repository';
import { SchedulingService } from '@/modules/scheduling/services/scheduling.service';

@Processor(SYSTEM_QUEUE)
export class SystemWorker extends WorkerHost {
  private readonly logger = new Logger(SystemWorker.name);

  constructor(
    private readonly adaptive: AdaptiveSchedulingRepository,
    private readonly scheduling: SchedulingService,
    private readonly progress: ProgressService,
  ) {
    super();
  }

  async process(job: Job): Promise<unknown> {
    if (job.name !== ADAPTIVE_DAILY_JOB) {
      this.logger.warn(`Unsupported system job received: ${job.name}`);
      throw new Error(`Unsupported job type: ${job.name}`);
    }
    const now = new Date();
    const detection = await this.adaptive.detectAndMarkMissed(now);
    for (const affected of detection.newlyAffected) {
      await this.adaptive.notifyReschedule(
        affected,
        affected.goalTargetDate.getTime() - now.getTime() < 7 * 86_400_000,
      );
    }
    let rescheduleJobs = 0;
    for (const affected of detection.affected) {
      await this.scheduling.rebalance(affected.userId, {
        roadmapId: affected.roadmapId,
        mode: ReschedulingMode.BALANCED,
      });
      rescheduleJobs += 1;
    }
    const snapshots = await this.progress.snapshotAll(now);
    const result = { newlyMissed: detection.newlyMissed, rescheduleJobs, snapshots };
    this.logger.log(`Adaptive daily processing complete: ${JSON.stringify(result)}`);
    return result;
  }
}
