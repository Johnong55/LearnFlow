import { Injectable } from '@nestjs/common';
import { Prisma, type User } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(userId: string) {
    return this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { profile: true, preference: true },
    });
  }

  async update(
    userId: string,
    profile: Prisma.UserProfileUpdateInput,
    preference: Prisma.UserPreferenceUpdateInput,
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        profile: { update: profile },
        preference: { update: preference },
      },
      include: { profile: true, preference: true },
    });
  }

  async softDelete(userId: string): Promise<User> {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return transaction.user.update({ where: { id: userId }, data: { deletedAt: new Date() } });
    });
  }
}
