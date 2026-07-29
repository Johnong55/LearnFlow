import { Injectable } from '@nestjs/common';
import { NotificationStatus } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, status?: NotificationStatus) {
    return this.prisma.notification.findMany({
      where: { userId, status },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  findOwned(userId: string, id: string) {
    return this.prisma.notification.findFirst({ where: { id, userId } });
  }

  markRead(userId: string, id: string) {
    return this.prisma.notification.update({
      where: { id, userId },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });
  }
}
