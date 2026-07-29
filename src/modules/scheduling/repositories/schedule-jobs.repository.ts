import { Injectable } from '@nestjs/common';
import { JobStatus, Prisma } from '@prisma/client';
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

  findActive(userId: string, roadmapId: string) {
    return this.prisma.backgroundJob.findFirst({
      where: {
        userId,
        queueName: SCHEDULE_QUEUE,
        status: { in: [JobStatus.QUEUED, JobStatus.RUNNING] },
        payload: { path: ['roadmapId'], equals: roadmapId },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(data: ScheduleJobData) {
    return this.prisma.backgroundJob.create({
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
