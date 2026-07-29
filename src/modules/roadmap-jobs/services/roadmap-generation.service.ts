import { InjectQueue } from '@nestjs/bullmq';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobStatus, Prisma } from '@prisma/client';
import type { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { ROADMAP_QUEUE, ROADMAP_SEARCH_JOB } from '@/infrastructure/queue/roadmap-queue.constants';
import type { RoadmapJobData } from '@/modules/roadmaps/interfaces/roadmap-pipeline.interface';
import { RoadmapsRepository } from '@/modules/roadmaps/repositories/roadmaps.repository';
import { RoadmapJobsRepository } from '../repositories/roadmap-jobs.repository';

@Injectable()
export class RoadmapGenerationService {
  constructor(
    @InjectQueue(ROADMAP_QUEUE) private readonly queue: Queue<RoadmapJobData>,
    private readonly jobs: RoadmapJobsRepository,
    private readonly roadmaps: RoadmapsRepository,
    private readonly config: ConfigService,
  ) {}

  async start(userId: string, goalId: string) {
    const context = await this.roadmaps.loadGenerationContext(userId, goalId);
    if (!context) throw new NotFoundException('Learning goal not found.');
    const active = await this.jobs.findActiveForGoal(userId, goalId);
    if (active) return this.view(active);

    const roadmap = await this.roadmaps.markGenerating(
      userId,
      goalId,
      `Personalized ${context.skill.name} Roadmap`,
    );
    const externalId = `${goalId}-version-${roadmap.currentVersionNumber + 1}`;
    const backgroundJobId = randomUUID();
    const runId = randomUUID();
    let created;
    try {
      created = await this.jobs.create(backgroundJobId, externalId, userId, goalId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await this.jobs.findByExternalId(userId, externalId);
        if (existing) return this.view(existing);
      }
      throw error;
    }
    await this.roadmaps.markGoalAnalyzing(userId, goalId);
    try {
      await this.enqueueSearch({ backgroundJobId, runId, userId, goalId });
    } catch (error) {
      await this.jobs.fail(
        backgroundJobId,
        'ROADMAP_ENQUEUE_FAILED',
        error instanceof Error ? error.message : 'Failed to enqueue roadmap generation.',
      );
      await this.roadmaps.markFailed(userId, goalId);
      throw error;
    }
    return this.view(created);
  }

  async get(userId: string, id: string) {
    const job = await this.jobs.findOwned(userId, id);
    if (!job) throw new NotFoundException('Roadmap generation job not found.');
    return this.view(job);
  }

  async retry(userId: string, id: string) {
    const job = await this.jobs.findOwned(userId, id);
    if (!job) throw new NotFoundException('Roadmap generation job not found.');
    if (job.status !== JobStatus.FAILED)
      throw new ConflictException('Only failed roadmap jobs can be retried.');
    const payload = job.payload as { goalId?: unknown } | null;
    if (typeof payload?.goalId !== 'string')
      throw new ConflictException('Roadmap job payload is invalid.');
    const context = await this.roadmaps.loadGenerationContext(userId, payload.goalId);
    if (!context) throw new NotFoundException('Learning goal not found.');
    await this.jobs.resetForRetry(id);
    await this.roadmaps.markGenerating(
      userId,
      payload.goalId,
      `Personalized ${context.skill.name} Roadmap`,
    );
    await this.roadmaps.markGoalAnalyzing(userId, payload.goalId);
    await this.enqueueSearch({
      backgroundJobId: id,
      runId: randomUUID(),
      userId,
      goalId: payload.goalId,
    });
    return this.get(userId, id);
  }

  private async enqueueSearch(data: RoadmapJobData): Promise<void> {
    await this.queue.add(ROADMAP_SEARCH_JOB, data, {
      jobId: `${data.backgroundJobId}-${data.runId}-${ROADMAP_SEARCH_JOB}`,
      attempts: this.config.get<number>('ROADMAP_JOB_ATTEMPTS', 3),
      backoff: {
        type: 'exponential',
        delay: this.config.get<number>('ROADMAP_JOB_BACKOFF_MS', 1000),
      },
    });
  }

  private view(job: {
    id: string;
    status: JobStatus;
    progress: number;
    statusMessage: string | null;
    errorCode: string | null;
    errorMessage: string | null;
    result: unknown;
    attempts: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      message: job.statusMessage,
      error: job.errorCode ? { code: job.errorCode, message: job.errorMessage } : null,
      result: job.result,
      retryCount: job.attempts,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }
}
