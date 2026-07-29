import { Injectable, NotFoundException } from '@nestjs/common';
import type { NotificationStatus } from '@prisma/client';
import { NotificationsRepository } from '../repositories/notifications.repository';

@Injectable()
export class NotificationsService {
  constructor(private readonly repository: NotificationsRepository) {}

  list(userId: string, status?: NotificationStatus) {
    return this.repository.list(userId, status);
  }

  async markRead(userId: string, id: string) {
    if (!(await this.repository.findOwned(userId, id)))
      throw new NotFoundException('Notification not found.');
    return this.repository.markRead(userId, id);
  }
}
