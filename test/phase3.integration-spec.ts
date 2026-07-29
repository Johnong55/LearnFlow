import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import {
  GoalPriority,
  JobStatus,
  ResourceContentType,
  RoadmapDifficulty,
  SkillLevel,
} from '@/generated/prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import type { RoadmapOutput } from '@/modules/roadmaps/domain/roadmap-output.schema';
import { RoadmapsRepository } from '@/modules/roadmaps/repositories/roadmaps.repository';

describe('Phase 3 roadmap persistence idempotency (integration)', () => {
  const prisma = new PrismaService(
    new ConfigService({ database: { url: process.env.DATABASE_URL } }),
  );
  const repository = new RoadmapsRepository(prisma);
  const userId = randomUUID();
  const goalId = randomUUID();
  const jobId = randomUUID();
  let skillId: string;

  beforeAll(async () => {
    await prisma.$connect();
    const skill = await prisma.skill.create({
      data: { name: `Phase 3 ${userId}`, slug: `phase-3-${userId}` },
    });
    skillId = skill.id;
    await prisma.user.create({
      data: {
        id: userId,
        email: `phase3-${userId}@example.test`,
        passwordHash: 'integration-test-only',
        profile: { create: { fullName: 'Phase 3 Integration Test' } },
        preference: { create: {} },
      },
    });
    await prisma.learningGoal.create({
      data: {
        id: goalId,
        userId,
        skillId,
        title: 'Generate an idempotent roadmap',
        description: 'Verify job retries cannot create duplicate versions.',
        currentLevel: SkillLevel.BEGINNER,
        targetLevel: SkillLevel.ADVANCED,
        targetDate: new Date(Date.now() + 60 * 86_400_000),
        priority: GoalPriority.HIGH,
        weeklyAvailableHours: 8,
        successCriteria: ['One version is persisted'],
      },
    });
    await prisma.backgroundJob.create({
      data: {
        id: jobId,
        userId,
        queueName: 'roadmap-generation',
        externalId: jobId,
        type: 'ROADMAP_GENERATION',
        status: JobStatus.RUNNING,
      },
    });
    await repository.markGenerating(userId, goalId, 'Idempotent Roadmap');
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.backgroundJob.deleteMany({ where: { id: jobId } });
    await prisma.skill.deleteMany({ where: { id: skillId } });
    await prisma.$disconnect();
  });

  it('returns the existing version when a validation job is retried', async () => {
    const source = {
      title: 'Grounded source',
      url: 'https://example.test/phase3-source',
      description: 'A test source.',
      sourceDomain: 'example.test',
      retrievedAt: new Date().toISOString(),
      contentType: ResourceContentType.ROADMAP,
      relevanceScore: 0.9,
      credibilityScore: 0.9,
      language: 'en',
    };
    const output: RoadmapOutput = {
      title: 'Idempotent Roadmap',
      summary: 'A roadmap used to verify idempotent version persistence.',
      estimatedWeeks: 8,
      weeklyHours: 8,
      difficulty: RoadmapDifficulty.INTERMEDIATE,
      assumptions: ['Test assumption'],
      prerequisites: ['Test prerequisite'],
      milestones: [
        {
          title: 'Milestone',
          order: 1,
          estimatedHours: 8,
          modules: [
            {
              title: 'Module',
              order: 1,
              estimatedHours: 8,
              sourceUrls: [source.url],
              tasks: [
                {
                  title: 'Learn',
                  type: 'LEARNING',
                  order: 1,
                  estimatedMinutes: 60,
                  difficulty: RoadmapDifficulty.BEGINNER,
                  priority: 3,
                },
                {
                  title: 'Practice',
                  type: 'PRACTICE',
                  order: 2,
                  estimatedMinutes: 60,
                  difficulty: RoadmapDifficulty.BEGINNER,
                  priority: 3,
                },
              ],
            },
          ],
        },
      ],
    };

    const first = await repository.saveGenerated(userId, goalId, jobId, output, [source], {
      provider: 'mock',
    });
    const retried = await repository.saveGenerated(userId, goalId, jobId, output, [source], {
      provider: 'mock',
    });

    expect(retried).toEqual(first);
    await expect(prisma.roadmapVersion.count({ where: { generationJobId: jobId } })).resolves.toBe(
      1,
    );
    await expect(
      prisma.taskDependency.count({
        where: { task: { module: { milestone: { versionId: first.versionId } } } },
      }),
    ).resolves.toBe(1);
  });
});
