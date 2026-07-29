import { ConflictException, Injectable } from '@nestjs/common';
import { LearningTaskStatus, Prisma, StudySessionStatus } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import type { CompleteSessionDto } from '../dto/complete-session.dto';
import type { TaskFeedbackDto } from '../dto/task-feedback.dto';

@Injectable()
export class SessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOwnedSession(userId: string, id: string) {
    return this.prisma.studySession.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        feedback: true,
        task: {
          include: {
            module: {
              include: { milestone: { include: { version: { include: { roadmap: true } } } } },
            },
          },
        },
      },
    });
  }

  async start(
    userId: string,
    session: { id: string; taskId: string; status: StudySessionStatus; startedAt: Date | null },
    now: Date,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const changed = await transaction.studySession.updateMany({
        where: { id: session.id, userId, status: session.status, deletedAt: null },
        data: {
          status: StudySessionStatus.IN_PROGRESS,
          startedAt: session.startedAt ?? now,
          lastResumedAt: now,
          pausedAt: null,
        },
      });
      if (!changed.count) throw new ConflictException('Session state changed concurrently.');
      await transaction.learningTask.updateMany({
        where: { id: session.taskId, status: LearningTaskStatus.PENDING },
        data: { status: LearningTaskStatus.IN_PROGRESS },
      });
      return transaction.studySession.findUniqueOrThrow({
        where: { id: session.id },
        include: { task: true, feedback: true },
      });
    });
  }

  async pause(
    userId: string,
    session: {
      id: string;
      status: StudySessionStatus;
      lastResumedAt: Date | null;
      accumulatedSeconds: number;
    },
    now: Date,
  ) {
    const accumulatedSeconds = this.accumulated(session, now);
    const changed = await this.prisma.studySession.updateMany({
      where: { id: session.id, userId, status: session.status, deletedAt: null },
      data: {
        status: StudySessionStatus.PAUSED,
        accumulatedSeconds,
        pausedAt: now,
        lastResumedAt: null,
      },
    });
    if (!changed.count) throw new ConflictException('Session state changed concurrently.');
    return this.prisma.studySession.findUniqueOrThrow({
      where: { id: session.id },
      include: { task: true, feedback: true },
    });
  }

  async complete(
    userId: string,
    session: {
      id: string;
      taskId: string;
      status: StudySessionStatus;
      lastResumedAt: Date | null;
      accumulatedSeconds: number;
    },
    dto: CompleteSessionDto,
    now: Date,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const accumulatedSeconds = this.accumulated(session, now);
      const actualMinutes = dto.actualMinutes ?? Math.max(1, Math.ceil(accumulatedSeconds / 60));
      const changed = await transaction.studySession.updateMany({
        where: { id: session.id, userId, status: session.status, deletedAt: null },
        data: {
          status: StudySessionStatus.COMPLETED,
          accumulatedSeconds,
          actualMinutes,
          completedAt: now,
          lastResumedAt: null,
          pausedAt: null,
        },
      });
      if (!changed.count) throw new ConflictException('Session state changed concurrently.');
      if (
        dto.difficultyRating !== undefined ||
        dto.focusLevel !== undefined ||
        dto.notes !== undefined ||
        dto.tookLongerThanExpected !== undefined
      ) {
        await transaction.sessionFeedback.upsert({
          where: { sessionId: session.id },
          create: {
            userId,
            taskId: session.taskId,
            sessionId: session.id,
            actualMinutes,
            difficultyRating: dto.difficultyRating,
            focusLevel: dto.focusLevel,
            notes: dto.notes,
            tookLongerThanExpected: dto.tookLongerThanExpected ?? false,
          },
          update: {
            actualMinutes,
            difficultyRating: dto.difficultyRating,
            focusLevel: dto.focusLevel,
            notes: dto.notes,
            tookLongerThanExpected: dto.tookLongerThanExpected,
          },
        });
      }
      const [task, aggregate] = await Promise.all([
        transaction.learningTask.findUniqueOrThrow({ where: { id: session.taskId } }),
        transaction.studySession.aggregate({
          where: { taskId: session.taskId, status: StudySessionStatus.COMPLETED, deletedAt: null },
          _sum: { actualMinutes: true },
        }),
      ]);
      if ((aggregate._sum.actualMinutes ?? 0) >= task.estimatedMinutes) {
        await transaction.learningTask.update({
          where: { id: task.id },
          data: { status: LearningTaskStatus.COMPLETED },
        });
        await transaction.studySession.updateMany({
          where: {
            taskId: task.id,
            status: StudySessionStatus.SCHEDULED,
            startAt: { gt: now },
          },
          data: { status: StudySessionStatus.CANCELLED },
        });
      }
      return transaction.studySession.findUniqueOrThrow({
        where: { id: session.id },
        include: { task: true, feedback: true },
      });
    });
  }

  async skip(
    userId: string,
    session: {
      id: string;
      status: StudySessionStatus;
      lastResumedAt: Date | null;
      accumulatedSeconds: number;
    },
    reason: string | undefined,
    now: Date,
  ) {
    const accumulatedSeconds = this.accumulated(session, now);
    const changed = await this.prisma.studySession.updateMany({
      where: { id: session.id, userId, status: session.status, deletedAt: null },
      data: {
        status: StudySessionStatus.SKIPPED,
        accumulatedSeconds,
        actualMinutes: accumulatedSeconds ? Math.ceil(accumulatedSeconds / 60) : null,
        skipReason: reason,
        lastResumedAt: null,
        pausedAt: null,
      },
    });
    if (!changed.count) throw new ConflictException('Session state changed concurrently.');
    return this.prisma.studySession.findUniqueOrThrow({
      where: { id: session.id },
      include: { task: true, feedback: true },
    });
  }

  findOwnedTask(userId: string, id: string) {
    return this.prisma.learningTask.findFirst({
      where: {
        id,
        module: { milestone: { version: { roadmap: { userId, deletedAt: null } } } },
      },
      include: { module: { include: { milestone: { include: { version: true } } } } },
    });
  }

  async completeTask(userId: string, taskId: string, now: Date) {
    return this.prisma.$transaction(async (transaction) => {
      const task = await transaction.learningTask.findFirstOrThrow({
        where: {
          id: taskId,
          module: { milestone: { version: { roadmap: { userId, deletedAt: null } } } },
        },
      });
      const updated = await transaction.learningTask.update({
        where: { id: task.id },
        data: { status: LearningTaskStatus.COMPLETED },
      });
      await transaction.studySession.updateMany({
        where: { taskId, status: StudySessionStatus.SCHEDULED, startAt: { gt: now } },
        data: { status: StudySessionStatus.CANCELLED },
      });
      return updated;
    });
  }

  createTaskFeedback(userId: string, taskId: string, dto: TaskFeedbackDto) {
    const data: Prisma.SessionFeedbackUncheckedCreateInput = {
      userId,
      taskId,
      difficultyRating: dto.difficultyRating,
      focusLevel: dto.focusLevel,
      actualMinutes: dto.actualMinutes,
      tookLongerThanExpected: dto.tookLongerThanExpected ?? false,
      notes: dto.notes,
    };
    return this.prisma.sessionFeedback.create({ data });
  }

  private accumulated(
    session: { accumulatedSeconds: number; lastResumedAt: Date | null },
    now: Date,
  ): number {
    if (!session.lastResumedAt) return session.accumulatedSeconds;
    return (
      session.accumulatedSeconds +
      Math.max(0, Math.floor((now.getTime() - session.lastResumedAt.getTime()) / 1000))
    );
  }
}
