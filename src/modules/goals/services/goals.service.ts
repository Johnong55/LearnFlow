import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GoalStatus, Prisma } from '@/generated/prisma/client';
import { AuditService } from '@/infrastructure/logging/audit.service';
import { SkillsService } from '@/modules/skills/services/skills.service';
import type { CreateGoalDto } from '../dto/create-goal.dto';
import type { UpdateGoalDto } from '../dto/update-goal.dto';
import { GoalsRepository } from '../repositories/goals.repository';

@Injectable()
export class GoalsService {
  constructor(
    private readonly repository: GoalsRepository,
    private readonly skills: SkillsService,
    private readonly audit: AuditService,
  ) {}

  list(userId: string, status?: GoalStatus) {
    return this.repository.list(userId, status);
  }

  async get(userId: string, id: string) {
    const goal = await this.repository.findOwned(userId, id);
    if (!goal) throw new NotFoundException('Learning goal not found.');
    return goal;
  }

  async create(userId: string, dto: CreateGoalDto) {
    this.validate(dto.currentLevel, dto.targetLevel, dto.targetDate);
    const skill = await this.skills.resolveSkill(dto.skillName, dto.skillCategory);
    const result = await this.repository.create(userId, skill.id, {
      title: dto.title.trim(),
      description: dto.description.trim(),
      currentLevel: dto.currentLevel,
      targetLevel: dto.targetLevel,
      targetDate: dto.targetDate,
      priority: dto.priority,
      weeklyAvailableHours: dto.weeklyAvailableHours,
      successCriteria: dto.successCriteria,
      userConstraints: dto.userConstraints as Prisma.InputJsonObject | undefined,
    });
    void this.audit.record({
      userId,
      action: 'LEARNING_GOAL_CREATED',
      entityType: 'LearningGoal',
      entityId: result.id,
    });
    return result;
  }

  async update(userId: string, id: string, dto: UpdateGoalDto) {
    const existing = await this.get(userId, id);
    if (existing.status === GoalStatus.COMPLETED || existing.status === GoalStatus.CANCELLED)
      throw new ConflictException('Completed or cancelled goals cannot be edited.');
    const current = dto.currentLevel ?? existing.currentLevel;
    const target = dto.targetLevel ?? existing.targetLevel;
    this.validate(current, target, dto.targetDate);
    let skillId: string | undefined;
    if (dto.skillName)
      skillId = (await this.skills.resolveSkill(dto.skillName, dto.skillCategory)).id;
    const data: Prisma.LearningGoalUpdateInput = {
      title: dto.title?.trim(),
      description: dto.description?.trim(),
      currentLevel: dto.currentLevel,
      targetLevel: dto.targetLevel,
      targetDate: dto.targetDate,
      priority: dto.priority,
      weeklyAvailableHours: dto.weeklyAvailableHours,
      successCriteria: dto.successCriteria,
      userConstraints: dto.userConstraints as Prisma.InputJsonObject | undefined,
      ...(skillId ? { skill: { connect: { id: skillId } } } : {}),
    };
    const result = await this.repository.update(userId, id, data);
    void this.audit.record({
      userId,
      action: 'LEARNING_GOAL_UPDATED',
      entityType: 'LearningGoal',
      entityId: id,
    });
    return result;
  }

  async pause(userId: string, id: string) {
    const goal = await this.get(userId, id);
    if (goal.status !== GoalStatus.ACTIVE && goal.status !== GoalStatus.ANALYZING)
      throw new ConflictException('Only active or analyzing goals can be paused.');
    return this.transition(userId, id, GoalStatus.PAUSED, 'LEARNING_GOAL_PAUSED');
  }

  async resume(userId: string, id: string) {
    const goal = await this.get(userId, id);
    if (goal.status !== GoalStatus.PAUSED)
      throw new ConflictException('Only paused goals can be resumed.');
    return this.transition(userId, id, GoalStatus.ACTIVE, 'LEARNING_GOAL_RESUMED');
  }

  async delete(userId: string, id: string): Promise<{ message: string }> {
    await this.get(userId, id);
    await this.repository.softDelete(userId, id);
    void this.audit.record({
      userId,
      action: 'LEARNING_GOAL_DELETED',
      entityType: 'LearningGoal',
      entityId: id,
    });
    return { message: 'Learning goal deleted successfully.' };
  }

  private async transition(userId: string, id: string, status: GoalStatus, action: string) {
    const result = await this.repository.update(userId, id, { status });
    void this.audit.record({ userId, action, entityType: 'LearningGoal', entityId: id });
    return result;
  }

  private validate(
    currentLevel: CreateGoalDto['currentLevel'],
    targetLevel: CreateGoalDto['targetLevel'],
    targetDate?: Date,
  ): void {
    this.skills.assertLevelProgression(currentLevel, targetLevel);
    if (targetDate && targetDate <= new Date())
      throw new BadRequestException('Target date must be in the future.');
  }
}
