import { Injectable } from '@nestjs/common';
import { Prisma, StudySessionStatus } from '@/generated/prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@Injectable()
export class CalendarRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, from: Date, to: Date) {
    return Promise.all([
      this.prisma.calendarEvent.findMany({
        where: { userId, deletedAt: null, startAt: { lt: to }, endAt: { gt: from } },
        orderBy: { startAt: 'asc' },
      }),
      this.prisma.studySession.findMany({
        where: {
          userId,
          deletedAt: null,
          status: { not: StudySessionStatus.CANCELLED },
          startAt: { lt: to },
          endAt: { gt: from },
        },
        include: {
          task: {
            include: {
              module: {
                include: {
                  milestone: {
                    include: { version: { select: { roadmapId: true } } },
                  },
                },
              },
            },
          },
        },
        orderBy: { startAt: 'asc' },
      }),
    ]);
  }

  findOwned(userId: string, id: string) {
    return this.prisma.calendarEvent.findFirst({ where: { id, userId, deletedAt: null } });
  }

  findFixedOverlaps(userId: string, startAt: Date, endAt: Date, excludeId?: string) {
    return this.prisma.calendarEvent.findFirst({
      where: {
        userId,
        deletedAt: null,
        isFixed: true,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  create(userId: string, data: Prisma.CalendarEventCreateWithoutUserInput) {
    return this.prisma.calendarEvent.create({
      data: { ...data, user: { connect: { id: userId } } },
    });
  }

  update(userId: string, id: string, data: Prisma.CalendarEventUpdateInput) {
    return this.prisma.calendarEvent.update({ where: { id, userId, deletedAt: null }, data });
  }

  softDelete(userId: string, id: string) {
    return this.prisma.calendarEvent.update({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  userTimeZone(userId: string) {
    return this.prisma.userProfile.findUnique({ where: { userId }, select: { timezone: true } });
  }
}
