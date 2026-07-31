import { InjectQueue } from '@nestjs/bullmq';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobStatus, Prisma, type BackgroundJob } from '@/generated/prisma/client';
import type { Job, Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import {
  ROADMAP_PERSONALIZATION_JOB,
  ROADMAP_QUEUE,
  ROADMAP_SEARCH_JOB,
  ROADMAP_SOURCE_PROCESSING_JOB,
  ROADMAP_VALIDATION_JOB,
} from '@/infrastructure/queue/roadmap-queue.constants';
import type { RoadmapJobData } from '@/modules/roadmaps/interfaces/roadmap-pipeline.interface';
import { RoadmapsRepository } from '@/modules/roadmaps/repositories/roadmaps.repository';
import { RoadmapJobsRepository } from '../repositories/roadmap-jobs.repository';

@Injectable()
export class RoadmapGenerationService {
  private readonly pipelineStages = [
    ROADMAP_SEARCH_JOB,
    ROADMAP_SOURCE_PROCESSING_JOB,
    ROADMAP_PERSONALIZATION_JOB,
    ROADMAP_VALIDATION_JOB,
  ] as const;

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
    if (active) return this.get(userId, active.id);

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
      created = await this.jobs.create(backgroundJobId, externalId, userId, goalId, runId);
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
    let job = await this.jobs.findOwned(userId, id);
    if (!job) throw new NotFoundException('Roadmap generation job not found.');
    job = await this.reconcileTerminalQueueState(job);
    return this.view(job);
  }

  async retry(userId: string, id: string) {
    let job = await this.jobs.findOwned(userId, id);
    if (!job) throw new NotFoundException('Roadmap generation job not found.');
    job = await this.reconcileTerminalQueueState(job);
    if (job.status !== JobStatus.FAILED)
      throw new ConflictException('Only failed roadmap jobs can be retried.');
    const payload = job.payload as { goalId?: unknown } | null;
    if (typeof payload?.goalId !== 'string')
      throw new ConflictException('Roadmap job payload is invalid.');
    const context = await this.roadmaps.loadGenerationContext(userId, payload.goalId);
    if (!context) throw new NotFoundException('Learning goal not found.');
    const runId = randomUUID();
    await this.jobs.resetForRetry(id, payload.goalId, runId);
    await this.roadmaps.markGenerating(
      userId,
      payload.goalId,
      `Personalized ${context.skill.name} Roadmap`,
    );
    await this.roadmaps.markGoalAnalyzing(userId, payload.goalId);
    await this.enqueueSearch({
      backgroundJobId: id,
      runId,
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

  private async reconcileTerminalQueueState(job: BackgroundJob): Promise<BackgroundJob> {
    if (job.status !== JobStatus.QUEUED && job.status !== JobStatus.RUNNING) return job;

    const payload = job.payload as { goalId?: unknown; runId?: unknown } | null;
    let queueJobs: Job<RoadmapJobData>[];
    if (typeof payload?.runId === 'string') {
      const candidates = await Promise.all(
        this.pipelineStages.map((stage) =>
          this.queue.getJob(`${job.id}-${payload.runId as string}-${stage}`),
        ),
      );
      queueJobs = candidates.filter((candidate): candidate is Job<RoadmapJobData> => !!candidate);
    } else {
      const candidates = await this.queue.getJobs(
        ['active', 'waiting', 'delayed', 'prioritized', 'waiting-children', 'failed'],
        0,
        499,
        true,
      );
      queueJobs = candidates.filter((candidate) => candidate.data.backgroundJobId === job.id);
    }

    const queueStates = await Promise.all(
      queueJobs.map(async (candidate) => ({ candidate, state: await candidate.getState() })),
    );
    const stillRunning = queueStates.some(({ state }) =>
      ['active', 'waiting', 'delayed', 'prioritized', 'waiting-children'].includes(state),
    );
    if (stillRunning) return job;

    const latestFailure = queueStates
      .filter(({ state }) => state === 'failed')
      .sort(
        (left, right) => (right.candidate.finishedOn ?? 0) - (left.candidate.finishedOn ?? 0),
      )[0]?.candidate;
    if (!latestFailure) return job;

    const errorMessage = latestFailure.failedReason || 'Roadmap generation failed in BullMQ.';
    const errorCode = errorMessage.trimStart().startsWith('[')
      ? 'AI_OUTPUT_INVALID'
      : `ROADMAP_${latestFailure.name.toUpperCase().replaceAll('-', '_')}_FAILED`;
    await this.jobs.fail(job.id, errorCode, errorMessage.slice(0, 2000));
    if (job.userId && typeof payload?.goalId === 'string') {
      await this.roadmaps.markFailed(job.userId, payload.goalId);
    }
    const reconciled = job.userId ? await this.jobs.findOwned(job.userId, job.id) : null;
    return reconciled ?? job;
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
