import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ConstraintPriority,
  LearningTaskStatus,
  SchedulingConflictStatus,
  StudySessionSource,
  StudySessionStatus,
} from '@prisma/client';
import { addLocalDays, localDateKey, zonedDateTimeToUtc } from '@/common/utils/timezone.utils';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import type { SchedulePlan, SchedulingInput } from '../domain/scheduling.types';

@Injectable()
export class SchedulingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buildInput(
    userId: string,
    roadmapId: string,
    range: {
      from: string;
      to: string;
      mode: SchedulingInput['mode'];
      minimumSessionMinutes: number;
      breakMinutes: number;
    },
  ): Promise<{ input: SchedulingInput; version: number }> {
    const roadmap = await this.prisma.roadmap.findFirst({
      where: { id: roadmapId, userId, deletedAt: null },
      include: {
        goal: true,
        user: { include: { profile: true, preference: true } },
      },
    });
    if (!roadmap) throw new NotFoundException('Roadmap not found.');
    const versionNumber = roadmap.activeVersionNumber ?? roadmap.currentVersionNumber;
    if (!versionNumber) throw new NotFoundException('Roadmap has no generated version.');
    const version = await this.prisma.roadmapVersion.findUnique({
      where: { roadmapId_version: { roadmapId, version: versionNumber } },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
          include: {
            modules: {
              orderBy: { order: 'asc' },
              include: {
                tasks: {
                  where: {
                    status: { in: [LearningTaskStatus.PENDING, LearningTaskStatus.IN_PROGRESS] },
                  },
                  orderBy: { order: 'asc' },
                  include: {
                    dependencies: true,
                    studySessions: {
                      where: { status: StudySessionStatus.COMPLETED, deletedAt: null },
                      select: { actualMinutes: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!version) throw new NotFoundException('Roadmap version not found.');
    const timeZone = roadmap.user.profile?.timezone ?? 'UTC';
    const startAt = zonedDateTimeToUtc(range.from, '00:00', timeZone);
    const endAt = zonedDateTimeToUtc(addLocalDays(range.to, 1), '00:00', timeZone);
    const [routines, availabilityRules, calendarEvents, existingSessions] = await Promise.all([
      this.prisma.routine.findMany({ where: { userId, deletedAt: null } }),
      this.prisma.availabilityRule.findMany({ where: { userId, deletedAt: null } }),
      this.prisma.calendarEvent.findMany({
        where: {
          userId,
          deletedAt: null,
          isFixed: true,
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
      }),
      this.prisma.studySession.findMany({
        where: {
          userId,
          deletedAt: null,
          status: {
            notIn: [
              StudySessionStatus.CANCELLED,
              StudySessionStatus.SKIPPED,
              StudySessionStatus.MISSED,
            ],
          },
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
        include: {
          task: { include: { module: { include: { milestone: { include: { version: true } } } } } },
        },
      }),
    ]);
    const sessionsToKeep = existingSessions.filter(
      (session) =>
        session.task.module.milestone.version.roadmapId !== roadmapId ||
        session.status !== StudySessionStatus.SCHEDULED ||
        session.source === StudySessionSource.MANUAL,
    );
    const existingDailyMinutes: Record<string, number> = {};
    for (const session of sessionsToKeep) {
      const key = localDateKey(session.startAt, timeZone);
      existingDailyMinutes[key] = (existingDailyMinutes[key] ?? 0) + session.plannedMinutes;
    }
    return {
      version: versionNumber,
      input: {
        from: range.from,
        to: range.to,
        timeZone,
        tasks: version.milestones.flatMap((milestone) =>
          milestone.modules.flatMap((module) =>
            module.tasks
              .map((task) => ({
                id: task.id,
                title: task.title,
                estimatedMinutes: Math.max(
                  0,
                  task.estimatedMinutes -
                    task.studySessions.reduce(
                      (sum, session) => sum + (session.actualMinutes ?? 0),
                      0,
                    ),
                ),
                difficulty: task.difficulty,
                priority: task.priority,
                order: task.order,
                moduleOrder: module.order,
                milestoneOrder: milestone.order,
                dependencyIds: task.dependencies.map((dependency) => dependency.prerequisiteId),
              }))
              .filter((task) => task.estimatedMinutes > 0),
          ),
        ),
        routines: routines.map((routine) => ({
          id: routine.id,
          weekdays: routine.weekdays,
          startTime: routine.startTime,
          endTime: routine.endTime,
          priority: routine.isFlexible ? ConstraintPriority.SOFT : routine.constraintPriority,
          bufferBeforeMinutes: routine.bufferBeforeMinutes,
          bufferAfterMinutes: routine.bufferAfterMinutes,
          type: routine.type,
        })),
        availabilityRules: availabilityRules.map((rule) => ({
          id: rule.id,
          weekdays: rule.weekdays,
          startTime: rule.startTime,
          endTime: rule.endTime,
          priority: rule.constraintPriority,
          type: rule.type,
          effectiveFrom: rule.effectiveFrom,
          effectiveUntil: rule.effectiveUntil,
        })),
        blockedSlots: [
          ...calendarEvents.map((event) => ({ startAt: event.startAt, endAt: event.endAt })),
          ...sessionsToKeep.map((session) => ({ startAt: session.startAt, endAt: session.endAt })),
        ],
        existingDailyMinutes,
        preferredSessionMinutes: roadmap.user.preference?.preferredSessionMinutes ?? 45,
        minimumSessionMinutes: range.minimumSessionMinutes,
        maxDailyLearningMinutes: roadmap.user.preference?.maxDailyLearningMinutes ?? 120,
        breakMinutes: range.breakMinutes,
        preferredStudyTime: roadmap.user.preference?.preferredStudyTime,
        preferredStudyDays: roadmap.user.preference?.preferredStudyDays ?? [],
        mode: range.mode,
      },
    };
  }

  async replaceGeneratedPlan(
    userId: string,
    roadmapId: string,
    from: Date,
    to: Date,
    plan: SchedulePlan,
    source: StudySessionSource,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.studySession.deleteMany({
        where: {
          userId,
          source: { in: [StudySessionSource.GENERATED, StudySessionSource.REBALANCED] },
          status: StudySessionStatus.SCHEDULED,
          startAt: { gte: from, lt: to },
          task: { module: { milestone: { version: { roadmapId } } } },
        },
      });
      if (plan.sessions.length) {
        await transaction.studySession.createMany({
          data: plan.sessions.map((session) => ({
            userId,
            taskId: session.taskId,
            startAt: session.startAt,
            endAt: session.endAt,
            plannedMinutes: session.plannedMinutes,
            source,
          })),
          skipDuplicates: true,
        });
      }
      await transaction.schedulingConflict.updateMany({
        where: { userId, roadmapId, status: SchedulingConflictStatus.OPEN },
        data: { status: SchedulingConflictStatus.RESOLVED, resolvedAt: new Date() },
      });
      for (const conflict of plan.unscheduledTasks) {
        await transaction.schedulingConflict.create({
          data: {
            userId,
            roadmapId,
            taskId: conflict.taskId,
            code: conflict.code,
            reason: conflict.reason,
            details: { remainingMinutes: conflict.remainingMinutes },
          },
        });
      }
      return {
        ...plan.summary,
        sessionIds: (
          await transaction.studySession.findMany({
            where: {
              userId,
              startAt: { gte: from, lt: to },
              task: { module: { milestone: { version: { roadmapId } } } },
            },
            select: { id: true },
            orderBy: { startAt: 'asc' },
          })
        ).map((session) => session.id),
      };
    });
  }

  listConflicts(userId: string) {
    return this.prisma.schedulingConflict.findMany({
      where: { userId, status: SchedulingConflictStatus.OPEN },
      include: {
        task: { select: { id: true, title: true } },
        roadmap: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  targetDate(userId: string, roadmapId: string) {
    return this.prisma.roadmap.findFirst({
      where: { id: roadmapId, userId, deletedAt: null },
      select: { goal: { select: { targetDate: true } }, user: { select: { profile: true } } },
    });
  }
}
