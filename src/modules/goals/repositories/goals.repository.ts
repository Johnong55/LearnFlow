import { Injectable } from '@nestjs/common';
import { GoalStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@Injectable()
export class GoalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, status?: GoalStatus) {
    return this.prisma.learningGoal.findMany({
      where: { userId, deletedAt: null, status },
      include: { skill: true },
      orderBy: [{ priority: 'desc' }, { targetDate: 'asc' }],
    });
  }

  findOwned(userId: string, id: string) {
    return this.prisma.learningGoal.findFirst({
      where: { id, userId, deletedAt: null },
      include: { skill: true },
    });
  }

  create(
    userId: string,
    skillId: string,
    data: Omit<Prisma.LearningGoalUncheckedCreateInput, 'userId' | 'skillId'>,
  ) {
    return this.prisma.learningGoal.create({
      data: { ...data, userId, skillId },
      include: { skill: true },
    });
  }

  update(userId: string, id: string, data: Prisma.LearningGoalUpdateInput) {
    return this.prisma.learningGoal.update({
      where: { id, userId, deletedAt: null },
      data,
      include: { skill: true },
    });
  }

  softDelete(userId: string, id: string) {
    return this.prisma.learningGoal.update({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
