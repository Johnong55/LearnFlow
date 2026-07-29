import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SkillLevel, UserSkillType } from '@/generated/prisma/client';
import { AuditService } from '@/infrastructure/logging/audit.service';
import type { CreateSkillDto } from '../dto/create-skill.dto';
import type { UpdateSkillDto } from '../dto/update-skill.dto';
import type { UpsertUserSkillInput } from '../interfaces/upsert-user-skill.interface';
import { SkillsRepository } from '../repositories/skills.repository';

const levelOrder: Record<SkillLevel, number> = {
  NONE: 0,
  BEGINNER: 1,
  ELEMENTARY: 2,
  INTERMEDIATE: 3,
  ADVANCED: 4,
  EXPERT: 5,
};

@Injectable()
export class SkillsService {
  constructor(
    private readonly repository: SkillsRepository,
    private readonly audit: AuditService,
  ) {}

  list(userId: string) {
    return this.repository.list(userId);
  }

  async get(userId: string, id: string) {
    const skill = await this.repository.findOwned(userId, id);
    if (!skill) throw new NotFoundException('Skill not found.');
    return skill;
  }

  create(userId: string, dto: CreateSkillDto) {
    return this.upsertForUser(userId, dto);
  }

  async upsertForUser(userId: string, input: UpsertUserSkillInput) {
    const type = input.type ?? UserSkillType.CURRENT;
    const currentLevel = input.currentLevel ?? SkillLevel.NONE;
    if ((type === UserSkillType.TARGET || type === UserSkillType.BOTH) && !input.targetLevel)
      throw new BadRequestException('Target level is required for a target skill.');
    if (input.targetLevel) this.assertLevelProgression(currentLevel, input.targetLevel);
    const result = await this.repository.upsertForUser(userId, { ...input, type, currentLevel });
    void this.audit.record({
      userId,
      action: 'USER_SKILL_UPSERTED',
      entityType: 'UserSkill',
      entityId: result.id,
    });
    return result;
  }

  async update(userId: string, id: string, dto: UpdateSkillDto) {
    const existing = await this.get(userId, id);
    const currentLevel = dto.currentLevel ?? existing.currentLevel;
    const targetLevel = dto.targetLevel ?? existing.targetLevel;
    const type = dto.type ?? existing.type;
    if ((type === UserSkillType.TARGET || type === UserSkillType.BOTH) && !targetLevel)
      throw new BadRequestException('Target level is required for a target skill.');
    if (targetLevel) this.assertLevelProgression(currentLevel, targetLevel);
    const result = await this.repository.updateOwned(userId, id, dto);
    void this.audit.record({
      userId,
      action: 'USER_SKILL_UPDATED',
      entityType: 'UserSkill',
      entityId: id,
    });
    return result;
  }

  async delete(userId: string, id: string): Promise<{ message: string }> {
    await this.get(userId, id);
    await this.repository.softDelete(userId, id);
    void this.audit.record({
      userId,
      action: 'USER_SKILL_DELETED',
      entityType: 'UserSkill',
      entityId: id,
    });
    return { message: 'Skill deleted successfully.' };
  }

  assertLevelProgression(current: SkillLevel, target: SkillLevel): void {
    if (levelOrder[target] <= levelOrder[current])
      throw new BadRequestException('Target skill level must be higher than the current level.');
  }

  resolveSkill(name: string, category?: string) {
    return this.repository.resolveSkill(name, category);
  }
}
