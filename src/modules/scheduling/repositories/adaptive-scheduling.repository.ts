import { Injectable } from '@nestjs/common';
import { NotificationStatus, NotificationType, StudySessionStatus } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';

export interface AffectedSchedule {
  userId: string;
  roadmapId: string;
  goalTargetDate: Date;
}

@Injectable()
export class AdaptiveSchedulingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async detectAndMarkMissed(now: Date): Promise<{
    newlyMissed: number;
    newlyAffected: AffectedSchedule[];
    affected: AffectedSchedule[];
  }> {
    const expired = await this.prisma.studySession.findMany({
      where: {
        status: StudySessionStatus.SCHEDULED,
        endAt: { lt: now },
        deletedAt: null,
      },
      select: {
        id: true,
        userId: true,
        task: {
          select: {
            module: {
              select: {
                milestone: {
                  select: {
                    version: {
                      select: {
                        roadmap: { select: { id: true, goal: { select: { targetDate: true } } } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (expired.length) {
      await this.prisma.studySession.updateMany({
        where: { id: { in: expired.map((session) => session.id) } },
        data: { status: StudySessionStatus.MISSED },
      });
    }
    const pending = await this.prisma.studySession.findMany({
      where: {
        status: StudySessionStatus.MISSED,
        deletedAt: null,
        task: {
          status: { not: 'COMPLETED' },
        },
      },
      select: {
        userId: true,
        task: {
          select: {
            estimatedMinutes: true,
            studySessions: {
              where: {
                deletedAt: null,
                OR: [
                  { status: StudySessionStatus.COMPLETED },
                  { status: StudySessionStatus.SCHEDULED, startAt: { gt: now } },
                ],
              },
              select: { status: true, actualMinutes: true, plannedMinutes: true },
            },
            module: {
              select: {
                milestone: {
                  select: {
                    version: {
                      select: {
                        roadmap: { select: { id: true, goal: { select: { targetDate: true } } } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    const unique = new Map<string, AffectedSchedule>();
    for (const session of pending) {
      const completedMinutes = session.task.studySessions
        .filter((item) => item.status === StudySessionStatus.COMPLETED)
        .reduce((sum, item) => sum + (item.actualMinutes ?? 0), 0);
      const futureMinutes = session.task.studySessions
        .filter((item) => item.status === StudySessionStatus.SCHEDULED)
        .reduce((sum, item) => sum + item.plannedMinutes, 0);
      if (futureMinutes >= Math.max(0, session.task.estimatedMinutes - completedMinutes)) continue;
      const roadmap = session.task.module.milestone.version.roadmap;
      unique.set(`${session.userId}:${roadmap.id}`, {
        userId: session.userId,
        roadmapId: roadmap.id,
        goalTargetDate: roadmap.goal.targetDate,
      });
    }
    const newUnique = new Map<string, AffectedSchedule>();
    for (const session of expired) {
      const roadmap = session.task.module.milestone.version.roadmap;
      newUnique.set(`${session.userId}:${roadmap.id}`, {
        userId: session.userId,
        roadmapId: roadmap.id,
        goalTargetDate: roadmap.goal.targetDate,
      });
    }
    return {
      newlyMissed: expired.length,
      newlyAffected: [...newUnique.values()],
      affected: [...unique.values()],
    };
  }

  notifyReschedule(affected: AffectedSchedule, deadlineAtRisk: boolean) {
    return this.prisma.notification.create({
      data: {
        userId: affected.userId,
        type: deadlineAtRisk ? NotificationType.DEADLINE_RISK : NotificationType.SCHEDULE_CHANGED,
        status: NotificationStatus.PENDING,
        title: deadlineAtRisk ? 'Learning deadline at risk' : 'Study schedule adjusted',
        message: deadlineAtRisk
          ? 'A missed session was rescheduled, but your target deadline may be at risk.'
          : 'A missed session was returned to the scheduling queue.',
        metadata: { roadmapId: affected.roadmapId },
      },
    });
  }
}
