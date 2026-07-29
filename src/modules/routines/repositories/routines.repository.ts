import { Injectable } from '@nestjs/common';
import { ConstraintPriority, Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@Injectable()
export class RoutinesRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.routine.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ type: 'asc' }, { startTime: 'asc' }],
    });
  }

  findOwned(userId: string, id: string) {
    return this.prisma.routine.findFirst({ where: { id, userId, deletedAt: null } });
  }

  listFixed(userId: string, excludeId?: string) {
    return this.prisma.routine.findMany({
      where: {
        userId,
        deletedAt: null,
        isFlexible: false,
        constraintPriority: ConstraintPriority.HARD,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  create(userId: string, data: Prisma.RoutineCreateWithoutUserInput) {
    return this.prisma.routine.create({ data: { ...data, user: { connect: { id: userId } } } });
  }

  update(userId: string, id: string, data: Prisma.RoutineUpdateInput) {
    return this.prisma.routine.update({ where: { id, userId, deletedAt: null }, data });
  }

  softDelete(userId: string, id: string) {
    return this.prisma.routine.update({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
