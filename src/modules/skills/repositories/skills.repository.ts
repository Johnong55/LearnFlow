import { Injectable } from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { slugify } from '@/common/utils/slug.utils';
import type { UpsertUserSkillInput } from '../interfaces/upsert-user-skill.interface';

@Injectable()
export class SkillsRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.userSkill.findMany({
      where: { userId, deletedAt: null },
      include: { skill: true },
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
    });
  }

  findOwned(userId: string, id: string) {
    return this.prisma.userSkill.findFirst({
      where: { id, userId, deletedAt: null },
      include: { skill: true },
    });
  }

  async resolveSkill(name: string, category?: string) {
    const normalizedName = name.trim().replace(/\s+/g, ' ');
    const slug = slugify(normalizedName);
    return this.prisma.skill.upsert({
      where: { slug },
      create: { name: normalizedName, slug, category: category?.trim() },
      update: category ? { category: category.trim() } : {},
    });
  }

  async upsertForUser(userId: string, input: UpsertUserSkillInput) {
    const skill = await this.resolveSkill(input.name, input.category);
    return this.prisma.userSkill.upsert({
      where: { userId_skillId: { userId, skillId: skill.id } },
      create: {
        userId,
        skillId: skill.id,
        type: input.type,
        currentLevel: input.currentLevel,
        targetLevel: input.targetLevel,
        confidenceLevel: input.confidenceLevel,
        lastPracticedAt: input.lastPracticedAt,
      },
      update: {
        type: input.type,
        currentLevel: input.currentLevel,
        targetLevel: input.targetLevel,
        confidenceLevel: input.confidenceLevel,
        lastPracticedAt: input.lastPracticedAt,
        deletedAt: null,
      },
      include: { skill: true },
    });
  }

  updateOwned(userId: string, id: string, data: Prisma.UserSkillUpdateInput) {
    return this.prisma.userSkill.update({
      where: { id, userId, deletedAt: null },
      data,
      include: { skill: true },
    });
  }

  softDelete(userId: string, id: string) {
    return this.prisma.userSkill.update({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
