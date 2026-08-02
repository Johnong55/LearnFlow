import { Injectable } from '@nestjs/common';
import { JobStatus, Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { SCHEDULE_QUEUE } from '@/infrastructure/queue/schedule-queue.constants';
import type { ScheduleJobData } from '../interfaces/schedule-job.interface';

@Injectable()
export class ScheduleJobsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOwned(userId: string, id: string) {
    return this.prisma.backgroundJob.findFirst({
      where: { id, userId, queueName: SCHEDULE_QUEUE },
    });
  }

  createOrGetActive(data: ScheduleJobData) {
    return this.prisma.$transaction(async (transaction) => {
      const lockKey = `schedule:${data.userId}:${data.roadmapId}`;
      await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))::text`;
      const active = await transaction.backgroundJob.findFirst({
        where: {
          userId: data.userId,
          queueName: SCHEDULE_QUEUE,
          status: { in: [JobStatus.QUEUED, JobStatus.RUNNING] },
          payload: { path: ['roadmapId'], equals: data.roadmapId },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (active) return { job: active, created: false as const };

      const job = await transaction.backgroundJob.create({
        data: {
          id: data.backgroundJobId,
          userId: data.userId,
          queueName: SCHEDULE_QUEUE,
          externalId: data.backgroundJobId,
          type: 'SCHEDULE_GENERATION',
          status: JobStatus.QUEUED,
          statusMessage: 'Schedule generation queued.',
          payload: { ...data },
        },
      });
      return { job, created: true as const };
    });
  }

  running(id: string) {
    return this.prisma.backgroundJob.update({
      where: { id },
      data: {
        status: JobStatus.RUNNING,
        progress: 25,
        statusMessage: 'Calculating valid study time slots...',
        startedAt: new Date(),
      },
    });
  }

  complete(id: string, result: Prisma.InputJsonObject) {
    return this.prisma.backgroundJob.update({
      where: { id },
      data: {
        status: JobStatus.COMPLETED,
        progress: 100,
        statusMessage: 'Schedule completed.',
        result,
        completedAt: new Date(),
        errorCode: null,
        errorMessage: null,
      },
    });
  }

  fail(id: string, message: string) {
    return this.prisma.backgroundJob.update({
      where: { id },
      data: {
        status: JobStatus.FAILED,
        statusMessage: 'Schedule generation failed.',
        errorCode: 'SCHEDULE_GENERATION_FAILED',
        errorMessage: message,
        completedAt: new Date(),
      },
    });
  }
}
