import { Injectable } from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import type { ProgressCalculationInput, ProgressMetrics } from '../domain/progress-calculator';

@Injectable()
export class ProgressRepository {
  constructor(private readonly prisma: PrismaService) {}

  listGoalIds(userId: string) {
    return this.prisma.learningGoal.findMany({
      where: { userId, deletedAt: null },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  listAllGoalOwners() {
    return this.prisma.learningGoal.findMany({
      where: { deletedAt: null, roadmap: { isNot: null } },
      select: { id: true, userId: true },
    });
  }

  async inputForGoal(
    userId: string,
    goalId: string,
    now: Date,
  ): Promise<
    | {
        goal: { id: string; title: string; targetDate: Date };
        roadmapId: string | null;
        input: ProgressCalculationInput;
      }
    | undefined
  > {
    const goal = await this.prisma.learningGoal.findFirst({
      where: { id: goalId, userId, deletedAt: null },
      include: { user: { include: { profile: true, preference: true } }, roadmap: true },
    });
    if (!goal) return undefined;
    const versionNumber = goal.roadmap?.activeVersionNumber ?? goal.roadmap?.currentVersionNumber;
    const version =
      goal.roadmap && versionNumber
        ? await this.prisma.roadmapVersion.findUnique({
            where: { roadmapId_version: { roadmapId: goal.roadmap.id, version: versionNumber } },
            include: {
              milestones: {
                include: {
                  modules: {
                    include: {
                      tasks: {
                        include: {
                          studySessions: { where: { deletedAt: null } },
                        },
                      },
                    },
                  },
                },
              },
            },
          })
        : null;
    const tasks =
      version?.milestones.flatMap((milestone) =>
        milestone.modules.flatMap((module) =>
          module.tasks.map((task) => ({
            id: task.id,
            milestoneId: milestone.id,
            status: task.status,
            estimatedMinutes: task.estimatedMinutes,
          })),
        ),
      ) ?? [];
    const sessions =
      version?.milestones.flatMap((milestone) =>
        milestone.modules.flatMap((module) =>
          module.tasks.flatMap((task) =>
            task.studySessions.map((session) => ({
              taskId: task.id,
              startAt: session.startAt,
              endAt: session.endAt,
              plannedMinutes: session.plannedMinutes,
              actualMinutes: session.actualMinutes,
              status: session.status,
              completedAt: session.completedAt,
            })),
          ),
        ),
      ) ?? [];
    return {
      goal: { id: goal.id, title: goal.title, targetDate: goal.targetDate },
      roadmapId: goal.roadmap?.id ?? null,
      input: {
        tasks,
        sessions,
        milestoneIds: version?.milestones.map((milestone) => milestone.id) ?? [],
        targetDate: goal.targetDate,
        weeklyAvailableHours: Number(goal.weeklyAvailableHours),
        preferredStudyDays: goal.user.preference?.preferredStudyDays.length ?? 0,
        timeZone: goal.user.profile?.timezone ?? 'UTC',
        now,
      },
    };
  }

  saveSnapshot(
    userId: string,
    goalId: string,
    roadmapId: string,
    metrics: ProgressMetrics,
    periodStart: Date,
    periodEnd: Date,
  ) {
    const data = {
      userId,
      goalId,
      roadmapId,
      periodStart,
      periodEnd,
      snapshotDate: new Date(`${periodEnd.toISOString().slice(0, 10)}T00:00:00.000Z`),
      plannedMinutes: metrics.plannedLearningMinutes,
      actualMinutes: metrics.actualLearningMinutes,
      taskCompletionRate: new Prisma.Decimal(metrics.taskCompletionRate),
      milestoneCompletionRate: new Prisma.Decimal(metrics.milestoneCompletionRate),
      scheduleAdherenceRate: new Prisma.Decimal(metrics.scheduleAdherenceRate),
      currentStreak: metrics.currentStreak,
      weeklyConsistency: new Prisma.Decimal(metrics.weeklyConsistency),
      estimatedCompletionDate: metrics.estimatedCompletionDate,
      scheduleVarianceDays: metrics.scheduleVarianceDays,
    };
    return this.prisma.progressSnapshot.upsert({
      where: { goalId_snapshotDate: { goalId, snapshotDate: data.snapshotDate } },
      create: data,
      update: data,
    });
  }
}
