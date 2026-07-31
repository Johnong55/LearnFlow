import { Injectable } from '@nestjs/common';
import { JobStatus, Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@Injectable()
export class RoadmapJobsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOwned(userId: string, id: string) {
    return this.prisma.backgroundJob.findFirst({
      where: { id, userId, queueName: 'roadmap-generation' },
    });
  }

  findActiveForGoal(userId: string, goalId: string) {
    return this.prisma.backgroundJob.findFirst({
      where: {
        userId,
        queueName: 'roadmap-generation',
        status: { in: [JobStatus.QUEUED, JobStatus.RUNNING] },
        payload: { path: ['goalId'], equals: goalId },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByExternalId(userId: string, externalId: string) {
    return this.prisma.backgroundJob.findFirst({
      where: { userId, queueName: 'roadmap-generation', externalId },
    });
  }

  create(id: string, externalId: string, userId: string, goalId: string, runId: string) {
    return this.prisma.backgroundJob.create({
      data: {
        id,
        userId,
        queueName: 'roadmap-generation',
        externalId,
        type: 'ROADMAP_GENERATION',
        status: JobStatus.QUEUED,
        progress: 0,
        statusMessage: 'Roadmap generation queued.',
        payload: { goalId, runId },
      },
    });
  }

  async updateStage(id: string, status: JobStatus, progress: number, statusMessage: string) {
    const current = await this.prisma.backgroundJob.findUnique({
      where: { id },
      select: { progress: true },
    });
    return this.prisma.backgroundJob.update({
      where: { id },
      data: {
        status,
        progress: Math.max(current?.progress ?? 0, progress),
        statusMessage,
        startedAt: status === JobStatus.RUNNING ? new Date() : undefined,
        completedAt: status === JobStatus.RUNNING ? null : undefined,
        errorCode: status === JobStatus.RUNNING ? null : undefined,
        errorMessage: status === JobStatus.RUNNING ? null : undefined,
      },
    });
  }

  complete(id: string, result: Prisma.InputJsonObject) {
    return this.prisma.backgroundJob.update({
      where: { id },
      data: {
        status: JobStatus.COMPLETED,
        progress: 100,
        statusMessage: 'Roadmap completed.',
        result,
        completedAt: new Date(),
        errorCode: null,
        errorMessage: null,
      },
    });
  }

  fail(id: string, errorCode: string, errorMessage: string) {
    return this.prisma.backgroundJob.update({
      where: { id },
      data: {
        status: JobStatus.FAILED,
        statusMessage: 'Roadmap generation failed.',
        errorCode,
        errorMessage,
        completedAt: new Date(),
      },
    });
  }

  resetForRetry(id: string, goalId: string, runId: string) {
    return this.prisma.backgroundJob.update({
      where: { id },
      data: {
        status: JobStatus.QUEUED,
        progress: 0,
        statusMessage: 'Roadmap generation queued for retry.',
        errorCode: null,
        errorMessage: null,
        result: Prisma.JsonNull,
        startedAt: null,
        completedAt: null,
        attempts: { increment: 1 },
        payload: { goalId, runId },
      },
    });
  }
}
