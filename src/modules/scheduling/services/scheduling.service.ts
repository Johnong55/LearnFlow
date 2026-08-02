import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReschedulingMode, StudySessionSource } from '@/generated/prisma/client';
import type { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { addLocalDays, localDateKey } from '@/common/utils/timezone.utils';
import {
  SCHEDULE_GENERATION_JOB,
  SCHEDULE_QUEUE,
} from '@/infrastructure/queue/schedule-queue.constants';
import { SchedulingEngine } from '../domain/scheduling.engine';
import type { ScheduleRequestDto } from '../dto/schedule-request.dto';
import type { ScheduleJobData } from '../interfaces/schedule-job.interface';
import { ScheduleJobsRepository } from '../repositories/schedule-jobs.repository';
import { SchedulingRepository } from '../repositories/scheduling.repository';

@Injectable()
export class SchedulingService {
  constructor(
    @InjectQueue(SCHEDULE_QUEUE) private readonly queue: Queue<ScheduleJobData>,
    private readonly repository: SchedulingRepository,
    private readonly jobs: ScheduleJobsRepository,
    private readonly engine: SchedulingEngine,
    private readonly config: ConfigService,
  ) {}

  async preview(userId: string, dto: ScheduleRequestDto) {
    const request = await this.resolveRequest(userId, dto);
    const { input, version, replaceableSessionCount } = await this.repository.buildInput(
      userId,
      dto.roadmapId,
      request,
    );
    return {
      roadmapId: dto.roadmapId,
      roadmapVersion: version,
      ...this.engine.generate(input),
      impact: {
        action: replaceableSessionCount > 0 ? 'REBALANCE' : 'CREATE',
        existingSessions: replaceableSessionCount,
      },
    };
  }

  async generate(userId: string, dto: ScheduleRequestDto) {
    return this.enqueue(userId, dto, StudySessionSource.GENERATED);
  }

  rebalance(userId: string, dto: ScheduleRequestDto) {
    return this.enqueue(userId, dto, StudySessionSource.REBALANCED);
  }

  private async enqueue(userId: string, dto: ScheduleRequestDto, source: StudySessionSource) {
    const request = await this.resolveRequest(userId, dto);
    if (source === StudySessionSource.GENERATED) {
      const existingSessions = await this.repository.countReplaceableSessions(
        userId,
        dto.roadmapId,
        request,
      );
      if (existingSessions > 0) {
        throw new ConflictException(
          'A generated schedule already exists. Preview and use rebalance to update it safely.',
        );
      }
    }
    const data: ScheduleJobData = {
      backgroundJobId: randomUUID(),
      userId,
      roadmapId: dto.roadmapId,
      source,
      ...request,
    };
    const queued = await this.jobs.createOrGetActive(data);
    if (!queued.created) return this.jobView(queued.job);
    try {
      await this.queue.add(SCHEDULE_GENERATION_JOB, data, {
        jobId: data.backgroundJobId,
        attempts: this.config.get<number>('SCHEDULE_JOB_ATTEMPTS', 3),
        backoff: {
          type: 'exponential',
          delay: this.config.get<number>('SCHEDULE_JOB_BACKOFF_MS', 1000),
        },
      });
    } catch (error) {
      await this.jobs.fail(
        data.backgroundJobId,
        error instanceof Error ? error.message : 'Failed to enqueue schedule generation.',
      );
      throw error;
    }
    return this.jobView(queued.job);
  }

  conflicts(userId: string) {
    return this.repository.listConflicts(userId);
  }

  async getJob(userId: string, id: string) {
    const job = await this.jobs.findOwned(userId, id);
    if (!job) throw new NotFoundException('Schedule generation job not found.');
    return this.jobView(job);
  }

  private async resolveRequest(userId: string, dto: ScheduleRequestDto) {
    const roadmap = await this.repository.targetDate(userId, dto.roadmapId);
    if (!roadmap) throw new NotFoundException('Roadmap not found.');
    const timeZone = roadmap.user.profile?.timezone ?? 'UTC';
    const today = localDateKey(new Date(), timeZone);
    const from = dto.from ?? addLocalDays(today, 1);
    const estimatedWeeks = roadmap.versions[0]?.estimatedWeeks ?? 4;
    const defaultTo = addLocalDays(from, Math.min(364, estimatedWeeks * 7 - 1));
    const to = dto.to ?? defaultTo;
    if (to < from) throw new BadRequestException('Schedule end date must not precede start date.');
    if (to > addLocalDays(from, 364))
      throw new BadRequestException('A schedule request cannot exceed 365 days.');
    const constraints =
      typeof roadmap.goal.userConstraints === 'object' &&
      roadmap.goal.userConstraints !== null &&
      !Array.isArray(roadmap.goal.userConstraints)
        ? (roadmap.goal.userConstraints as Record<string, unknown>)
        : {};
    const requestedMode = constraints.reschedulingMode;
    const preferredMode = Object.values(ReschedulingMode).find((mode) => mode === requestedMode);
    return {
      from,
      to,
      timeZone,
      mode: dto.mode ?? preferredMode ?? ReschedulingMode.BALANCED,
      minimumSessionMinutes: dto.minimumSessionMinutes ?? 25,
      breakMinutes: dto.breakMinutes ?? 10,
    };
  }

  private jobView(job: {
    id: string;
    status: string;
    progress: number;
    statusMessage: string | null;
    errorCode: string | null;
    errorMessage: string | null;
    result: unknown;
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
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }
}
