import { Injectable } from '@nestjs/common';
import { Prisma, type RefreshToken, type User } from '@/generated/prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { profile: true, preference: true },
    });
  }

  findActiveUserById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { profile: true, preference: true },
    });
  }

  createUser(email: string, passwordHash: string, fullName: string) {
    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        profile: { create: { fullName } },
        preference: { create: {} },
      },
      include: { profile: true, preference: true },
    });
  }

  updateLastLogin(userId: string): Promise<User> {
    return this.prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  }

  createRefreshToken(data: Prisma.RefreshTokenUncheckedCreateInput): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({ data });
  }

  findRefreshToken(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });
  }

  async rotateRefreshToken(
    currentId: string,
    replacement: Prisma.RefreshTokenUncheckedCreateInput,
  ): Promise<RefreshToken> {
    return this.prisma.$transaction(async (transaction) => {
      const created = await transaction.refreshToken.create({ data: replacement });
      const updated = await transaction.refreshToken.updateMany({
        where: { id: currentId, revokedAt: null },
        data: { revokedAt: new Date(), replacedById: created.id },
      });
      if (updated.count !== 1) throw new Error('REFRESH_TOKEN_ALREADY_ROTATED');
      return created;
    });
  }

  revokeRefreshToken(tokenHash: string) {
    return this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  revokeTokenFamily(familyId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async createPasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({ where: { userId } }),
      this.prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } }),
    ]);
  }

  findPasswordResetToken(tokenHash: string) {
    return this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  async consumePasswordResetToken(id: string, userId: string, passwordHash: string): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const consumed = await transaction.passwordResetToken.updateMany({
        where: { id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (consumed.count !== 1) throw new Error('RESET_TOKEN_ALREADY_USED');
      await transaction.user.update({ where: { id: userId }, data: { passwordHash } });
      await transaction.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
  }
}
