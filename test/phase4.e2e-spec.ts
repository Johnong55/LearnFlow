import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import { INestApplication, INestApplicationContext, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import {
  GoalPriority,
  JobStatus,
  LearningTaskType,
  RoadmapDifficulty,
  RoadmapStatus,
  RoadmapVersionStatus,
  SkillLevel,
} from '@/generated/prisma/client';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { addLocalDays } from '@/common/utils/timezone.utils';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { WorkerModule } from '@/worker.module';

interface Envelope<T> {
  data: T;
}
interface JobView {
  jobId: string;
  status: string;
  result?: { scheduledSessions?: number };
}
const parse = <T>(text: string): Envelope<T> => JSON.parse(text) as Envelope<T>;

describe('Phase 4 deterministic scheduling (e2e)', () => {
  let app: INestApplication;
  let worker: INestApplicationContext;
  let server: Server;
  let prisma: PrismaService;
  const runId = randomUUID();
  const email = `phase4-e2e-${runId}@example.test`;
  const backgroundJobIds: string[] = [];
  let userId: string;
  let skillId: string;
  let roadmapId: string;
  let authorization: string;
  let scheduleDate: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
    server = app.getHttpServer() as Server;
    prisma = app.get(PrismaService);
    worker = await NestFactory.createApplicationContext(WorkerModule, { logger: false });

    const registration = await request(server)
      .post('/api/v1/auth/register')
      .send({ email, fullName: 'Phase Four E2E', password: 'Phase-4-E2E-Password-42' })
      .expect(201);
    authorization = `Bearer ${parse<{ tokens: { accessToken: string } }>(registration.text).data.tokens.accessToken}`;
    userId = (await prisma.user.findUniqueOrThrow({ where: { email } })).id;
    await prisma.userProfile.update({ where: { userId }, data: { timezone: 'UTC' } });

    scheduleDate = upcomingMonday();
    const skill = await prisma.skill.create({
      data: { name: `Phase 4 ${runId}`, slug: `phase-4-${runId}` },
    });
    skillId = skill.id;
    const goal = await prisma.learningGoal.create({
      data: {
        userId,
        skillId,
        title: 'Schedule a generated roadmap',
        description: 'Verify the deterministic scheduling engine through the REST API.',
        currentLevel: SkillLevel.BEGINNER,
        targetLevel: SkillLevel.ADVANCED,
        targetDate: new Date(`${addLocalDays(scheduleDate, 30)}T23:59:59.000Z`),
        priority: GoalPriority.HIGH,
        weeklyAvailableHours: 8,
        successCriteria: ['Study sessions are generated'],
      },
    });
    const generationJobId = randomUUID();
    backgroundJobIds.push(generationJobId);
    await prisma.backgroundJob.create({
      data: {
        id: generationJobId,
        userId,
        queueName: 'roadmap-generation',
        externalId: generationJobId,
        type: 'ROADMAP_GENERATION',
        status: JobStatus.COMPLETED,
      },
    });
    const roadmap = await prisma.roadmap.create({
      data: {
        userId,
        goalId: goal.id,
        title: 'Phase 4 Schedule Roadmap',
        status: RoadmapStatus.ACTIVE,
        currentVersionNumber: 1,
        activeVersionNumber: 1,
      },
    });
    roadmapId = roadmap.id;
    const version = await prisma.roadmapVersion.create({
      data: {
        roadmapId,
        generationJobId,
        version: 1,
        status: RoadmapVersionStatus.ACTIVE,
        summary: 'Scheduling fixture',
        estimatedWeeks: 4,
        weeklyHours: 8,
        difficulty: RoadmapDifficulty.BEGINNER,
        assumptions: [],
        prerequisites: [],
        generationMetadata: { provider: 'test' },
      },
    });
    const milestone = await prisma.roadmapMilestone.create({
      data: { versionId: version.id, title: 'Milestone', order: 1, estimatedHours: 2 },
    });
    const roadmapModule = await prisma.roadmapModule.create({
      data: { milestoneId: milestone.id, title: 'Module', order: 1, estimatedHours: 2 },
    });
    const first = await prisma.learningTask.create({
      data: {
        moduleId: roadmapModule.id,
        title: 'Prerequisite task',
        type: LearningTaskType.LEARNING,
        order: 1,
        estimatedMinutes: 60,
        difficulty: RoadmapDifficulty.BEGINNER,
      },
    });
    const second = await prisma.learningTask.create({
      data: {
        moduleId: roadmapModule.id,
        title: 'Dependent task',
        type: LearningTaskType.PRACTICE,
        order: 2,
        estimatedMinutes: 60,
        difficulty: RoadmapDifficulty.INTERMEDIATE,
      },
    });
    await prisma.taskDependency.create({
      data: { taskId: second.id, prerequisiteId: first.id },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.backgroundJob.deleteMany({ where: { id: { in: backgroundJobIds } } });
    await prisma.skill.deleteMany({ where: { id: skillId } });
    await worker.close();
    await app.close();
  });

  it('prevents fixed overlaps, previews, generates, and exposes sessions in calendar', async () => {
    const eventStart = `${scheduleDate}T06:00:00.000Z`;
    const eventEnd = `${scheduleDate}T18:00:00.000Z`;
    await request(server)
      .post('/api/v1/calendar/events')
      .set({ authorization })
      .send({ title: 'Fixed work block', type: 'WORK', startAt: eventStart, endAt: eventEnd })
      .expect(201);
    await request(server)
      .post('/api/v1/calendar/events')
      .set({ authorization })
      .send({
        title: 'Overlapping fixed event',
        startAt: `${scheduleDate}T17:00:00.000Z`,
        endAt: `${scheduleDate}T19:00:00.000Z`,
      })
      .expect(409);

    const body = {
      roadmapId,
      from: scheduleDate,
      to: scheduleDate,
      minimumSessionMinutes: 30,
      breakMinutes: 10,
    };
    const preview = await request(server)
      .post('/api/v1/schedules/preview')
      .set({ authorization })
      .send(body)
      .expect(200);
    const previewData = parse<{
      sessions: Array<{ startAt: string }>;
      summary: { scheduledSessions: number };
    }>(preview.text).data;
    expect(previewData.summary.scheduledSessions).toBe(4);
    expect(previewData.sessions.every((session) => session.startAt >= eventEnd)).toBe(true);

    const [firstJobId, duplicateJobId] = await Promise.all([
      startSchedule(body, 'generate'),
      startSchedule(body, 'generate'),
    ]);
    expect(duplicateJobId).toBe(firstJobId);
    const firstJob = await waitForJob(firstJobId);
    expect(firstJob.result?.scheduledSessions).toBe(4);
    await request(server)
      .post('/api/v1/schedules/generate')
      .set({ authorization })
      .send(body)
      .expect(409);

    const replacementPreview = await request(server)
      .post('/api/v1/schedules/preview')
      .set({ authorization })
      .send(body)
      .expect(200);
    expect(
      parse<{ impact: { action: string; existingSessions: number } }>(replacementPreview.text).data
        .impact,
    ).toEqual({ action: 'REBALANCE', existingSessions: 4 });

    const secondJob = await startAndWait(body, 'rebalance');
    expect(secondJob.result?.scheduledSessions).toBe(4);
    await expect(
      prisma.studySession.count({
        where: { userId, task: { module: { milestone: { version: { roadmapId } } } } },
      }),
    ).resolves.toBe(4);

    const calendar = await request(server)
      .get('/api/v1/calendar')
      .query({
        from: `${scheduleDate}T00:00:00.000Z`,
        to: `${addLocalDays(scheduleDate, 1)}T00:00:00.000Z`,
      })
      .set({ authorization })
      .expect(200);
    const items = parse<{ items: Array<{ kind: string }> }>(calendar.text).data.items;
    expect(items.filter((item) => item.kind === 'STUDY_SESSION')).toHaveLength(4);
  });

  async function startAndWait(
    body: Record<string, unknown>,
    action: 'generate' | 'rebalance' = 'generate',
  ): Promise<JobView> {
    return waitForJob(await startSchedule(body, action));
  }

  async function startSchedule(
    body: Record<string, unknown>,
    action: 'generate' | 'rebalance',
  ): Promise<string> {
    const started = await request(server)
      .post(`/api/v1/schedules/${action}`)
      .set({ authorization })
      .send(body);
    if (started.status !== 202) {
      throw new Error(`Failed to ${action} schedule: ${started.status} ${started.text}`);
    }
    const id = parse<JobView>(started.text).data.jobId;
    if (!backgroundJobIds.includes(id)) backgroundJobIds.push(id);
    return id;
  }

  async function waitForJob(id: string): Promise<JobView> {
    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      const response = await request(server)
        .get(`/api/v1/schedules/jobs/${id}`)
        .set({ authorization })
        .expect(200);
      const job = parse<JobView>(response.text).data;
      if (job.status === 'COMPLETED') return job;
      if (job.status === 'FAILED') throw new Error(`Schedule generation failed: ${response.text}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Schedule job ${id} did not complete within 15 seconds.`);
  }

  function upcomingMonday(): string {
    const now = new Date();
    const daysUntilMonday = (8 - now.getUTCDay()) % 7 || 7;
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilMonday),
    )
      .toISOString()
      .slice(0, 10);
  }
});
