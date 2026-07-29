import { randomUUID } from 'node:crypto';
import {
  ConstraintPriority,
  DayOfWeek,
  GoalPriority,
  RoutineType,
  SkillLevel,
  UserSkillType,
} from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { GoalsRepository } from '@/modules/goals/repositories/goals.repository';
import { RoutinesRepository } from '@/modules/routines/repositories/routines.repository';
import { SkillsRepository } from '@/modules/skills/repositories/skills.repository';

describe('Phase 2 repositories (integration)', () => {
  const prisma = new PrismaService();
  const skills = new SkillsRepository(prisma);
  const goals = new GoalsRepository(prisma);
  const routines = new RoutinesRepository(prisma);
  const userId = randomUUID();
  let skillId: string | undefined;

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.user.create({
      data: {
        id: userId,
        email: `phase2-${userId}@example.test`,
        passwordHash: 'integration-test-only',
        profile: { create: { fullName: 'Phase 2 Integration Test' } },
        preference: { create: {} },
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: userId } });
    if (skillId) await prisma.skill.deleteMany({ where: { id: skillId } });
    await prisma.$disconnect();
  });

  it('persists owned skills, goals, and recurring routines', async () => {
    const userSkill = await skills.upsertForUser(userId, {
      name: `Integration Skill ${userId}`,
      type: UserSkillType.TARGET,
      currentLevel: SkillLevel.BEGINNER,
      targetLevel: SkillLevel.ADVANCED,
    });
    skillId = userSkill.skillId;

    const goal = await goals.create(userId, userSkill.skillId, {
      title: 'Integration goal',
      description: 'Verify Phase 2 persistence boundaries.',
      currentLevel: SkillLevel.BEGINNER,
      targetLevel: SkillLevel.ADVANCED,
      targetDate: new Date(Date.now() + 30 * 86_400_000),
      priority: GoalPriority.HIGH,
      weeklyAvailableHours: 8,
      successCriteria: ['Integration test passes'],
    });
    const routine = await routines.create(userId, {
      type: RoutineType.WORK,
      title: 'Integration work routine',
      weekdays: [DayOfWeek.MONDAY],
      startTime: '09:00',
      endTime: '17:00',
      constraintPriority: ConstraintPriority.HARD,
    });

    await expect(goals.findOwned(userId, goal.id)).resolves.toMatchObject({ id: goal.id, userId });
    await expect(goals.findOwned(randomUUID(), goal.id)).resolves.toBeNull();
    await expect(routines.findOwned(userId, routine.id)).resolves.toMatchObject({
      id: routine.id,
      userId,
    });
  });
});
