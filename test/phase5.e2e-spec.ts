import { getQueueToken } from '@nestjs/bullmq';
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
  StudySessionStatus,
} from '@/generated/prisma/client';
import type { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { ADAPTIVE_DAILY_JOB, SYSTEM_QUEUE } from '@/infrastructure/queue/queue.constants';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { WorkerModule } from '@/worker.module';

interface Envelope<T> {
  data: T;
}
interface JobView {
  jobId: string;
  status: string;
}
const parse = <T>(text: string): Envelope<T> => JSON.parse(text) as Envelope<T>;

describe('Phase 5 progress and adaptive scheduling (e2e)', () => {
  let app: INestApplication;
  let worker: INestApplicationContext;
  let server: Server;
  let prisma: PrismaService;
  let systemQueue: Queue;
  let authorization: string;
  let userId: string;
  let secondUserId: string;
  let skillId: string;
  let goalId: string;
  let roadmapId: string;
  let firstTaskId: string;
  let secondTaskId: string;
  let thirdTaskId: string;
  let firstSessionId: string;
  let secondSessionId: string;
  let skippedSessionId: string;
  let missedSessionId: string;
  const runId = randomUUID();
  const email = `phase5-e2e-${runId}@example.test`;
  const secondEmail = `phase5-other-${runId}@example.test`;

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
    systemQueue = worker.get<Queue>(getQueueToken(SYSTEM_QUEUE));

    const registration = await request(server)
      .post('/api/v1/auth/register')
      .send({ email, fullName: 'Phase Five E2E', password: 'Phase-5-E2E-Password-42' })
      .expect(201);
    authorization = `Bearer ${parse<{ tokens: { accessToken: string } }>(registration.text).data.tokens.accessToken}`;
    userId = (await prisma.user.findUniqueOrThrow({ where: { email } })).id;
    const other = await request(server)
      .post('/api/v1/auth/register')
      .send({ email: secondEmail, fullName: 'Other User', password: 'Phase-5-Other-Password-42' })
      .expect(201);
    void other;
    secondUserId = (await prisma.user.findUniqueOrThrow({ where: { email: secondEmail } })).id;
    await prisma.userProfile.update({ where: { userId }, data: { timezone: 'UTC' } });
    const skill = await prisma.skill.create({
      data: { name: `Phase 5 ${runId}`, slug: `phase-5-${runId}` },
    });
    skillId = skill.id;
    const goal = await prisma.learningGoal.create({
      data: {
        userId,
        skillId,
        title: 'Track adaptive learning progress',
        description: 'Exercise session state, progress metrics, and automatic rescheduling.',
        currentLevel: SkillLevel.BEGINNER,
        targetLevel: SkillLevel.ADVANCED,
        targetDate: new Date(Date.now() + 45 * 86_400_000),
        priority: GoalPriority.HIGH,
        weeklyAvailableHours: 8,
        successCriteria: ['Progress is measurable'],
      },
    });
    goalId = goal.id;
    const generationJobId = randomUUID();
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
        goalId,
        title: 'Phase 5 Roadmap',
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
        summary: 'Phase 5 fixture',
        estimatedWeeks: 6,
        weeklyHours: 8,
        difficulty: RoadmapDifficulty.INTERMEDIATE,
        assumptions: [],
        prerequisites: [],
        generationMetadata: { provider: 'test' },
      },
    });
    const milestone = await prisma.roadmapMilestone.create({
      data: { versionId: version.id, title: 'Milestone', order: 1, estimatedHours: 3 },
    });
    const roadmapModule = await prisma.roadmapModule.create({
      data: { milestoneId: milestone.id, title: 'Module', order: 1, estimatedHours: 3 },
    });
    const tasks = [];
    for (let order = 1; order <= 3; order += 1) {
      tasks.push(
        await prisma.learningTask.create({
          data: {
            moduleId: roadmapModule.id,
            title: `Phase 5 Task ${order}`,
            type: LearningTaskType.PRACTICE,
            order,
            estimatedMinutes: 60,
            difficulty: RoadmapDifficulty.INTERMEDIATE,
          },
        }),
      );
    }
    firstTaskId = tasks[0]!.id;
    secondTaskId = tasks[1]!.id;
    thirdTaskId = tasks[2]!.id;
    const tomorrow = new Date(Date.now() + 24 * 60 * 60_000);
    tomorrow.setUTCHours(6, 0, 0, 0);
    const createSession = (taskId: string, offsetMinutes: number) =>
      prisma.studySession.create({
        data: {
          userId,
          taskId,
          startAt: new Date(tomorrow.getTime() + offsetMinutes * 60_000),
          endAt: new Date(tomorrow.getTime() + (offsetMinutes + 30) * 60_000),
          plannedMinutes: 30,
        },
      });
    firstSessionId = (await createSession(firstTaskId, 0)).id;
    secondSessionId = (await createSession(firstTaskId, 40)).id;
    skippedSessionId = (await createSession(secondTaskId, 80)).id;
    missedSessionId = (
      await prisma.studySession.create({
        data: {
          userId,
          taskId: thirdTaskId,
          startAt: new Date(Date.now() - 2 * 60 * 60_000),
          endAt: new Date(Date.now() - 60 * 60_000),
          plannedMinutes: 60,
        },
      })
    ).id;
  });

  afterAll(async () => {
    const jobIds = (
      await prisma.backgroundJob.findMany({ where: { userId }, select: { id: true } })
    ).map((job) => job.id);
    await prisma.user.deleteMany({ where: { id: { in: [userId, secondUserId] } } });
    await prisma.backgroundJob.deleteMany({ where: { id: { in: jobIds } } });
    await prisma.skill.deleteMany({ where: { id: skillId } });
    await worker.close();
    await app.close();
  });

  it('enforces ownership and supports start, pause, resume, complete, and feedback', async () => {
    const secondLogin = await request(server)
      .post('/api/v1/auth/login')
      .send({ email: secondEmail, password: 'Phase-5-Other-Password-42' })
      .expect(200);
    const secondAuthorization = `Bearer ${parse<{ tokens: { accessToken: string } }>(secondLogin.text).data.tokens.accessToken}`;
    await request(server)
      .post(`/api/v1/sessions/${firstSessionId}/start`)
      .set({ authorization: secondAuthorization })
      .send({})
      .expect(404);

    await request(server)
      .post(`/api/v1/sessions/${firstSessionId}/start`)
      .set({ authorization })
      .send({})
      .expect(200);
    await request(server)
      .post(`/api/v1/sessions/${firstSessionId}/pause`)
      .set({ authorization })
      .send({})
      .expect(200);
    await request(server)
      .post(`/api/v1/sessions/${firstSessionId}/start`)
      .set({ authorization })
      .send({})
      .expect(200);
    await request(server)
      .post(`/api/v1/sessions/${firstSessionId}/complete`)
      .set({ authorization })
      .send({ actualMinutes: 30, focusLevel: 4, difficultyRating: 3, notes: 'Good session' })
      .expect(200);
    await request(server)
      .post(`/api/v1/sessions/${secondSessionId}/start`)
      .set({ authorization })
      .send({})
      .expect(200);
    await request(server)
      .post(`/api/v1/sessions/${secondSessionId}/complete`)
      .set({ authorization })
      .send({ actualMinutes: 30 })
      .expect(200);
    await request(server)
      .post(`/api/v1/sessions/${secondSessionId}/start`)
      .set({ authorization })
      .send({})
      .expect(409);
    await expect(
      prisma.learningTask.findUniqueOrThrow({ where: { id: firstTaskId } }),
    ).resolves.toMatchObject({ status: 'COMPLETED' });

    await request(server)
      .post(`/api/v1/tasks/${secondTaskId}/feedback`)
      .set({ authorization })
      .send({ tookLongerThanExpected: true, actualMinutes: 75, notes: 'Needs more practice' })
      .expect(201);
  });

  it('calculates progress and rebalances skipped sessions without overloading the next day', async () => {
    const progress = await request(server)
      .get(`/api/v1/progress/goals/${goalId}`)
      .set({ authorization })
      .expect(200);
    const metrics = parse<{
      metrics: { actualLearningMinutes: number; taskCompletionRate: number };
    }>(progress.text).data.metrics;
    expect(metrics.actualLearningMinutes).toBe(60);
    expect(metrics.taskCompletionRate).toBeCloseTo(33.33, 2);

    const skipped = await request(server)
      .post(`/api/v1/sessions/${skippedSessionId}/skip`)
      .set({ authorization })
      .send({ reason: 'Unexpected appointment', reschedulingMode: 'LOW_STRESS' })
      .expect(200);
    const jobId = parse<{ rescheduleJob: JobView }>(skipped.text).data.rescheduleJob.jobId;
    await waitForScheduleJob(jobId);
    const future = await prisma.studySession.findMany({
      where: { taskId: secondTaskId, status: StudySessionStatus.SCHEDULED },
    });
    expect(future.length).toBeGreaterThan(0);
    const minutesByDay = new Map<string, number>();
    for (const session of future) {
      const key = session.startAt.toISOString().slice(0, 10);
      minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + session.plannedMinutes);
    }
    expect(Math.max(...minutesByDay.values())).toBeLessThanOrEqual(84);
  });

  it('daily worker marks missed sessions, creates a replacement, snapshot, and notification', async () => {
    await prisma.studySession.deleteMany({
      where: {
        taskId: thirdTaskId,
        status: StudySessionStatus.SCHEDULED,
        startAt: { gt: new Date() },
      },
    });
    const adaptiveJob = await systemQueue.add(
      ADAPTIVE_DAILY_JOB,
      {},
      { jobId: `phase5-e2e-${runId}` },
    );
    const deadline = Date.now() + 15_000;
    let observed: Record<string, unknown> = {};
    while (Date.now() < deadline) {
      const [missed, replacement, snapshots, notifications] = await Promise.all([
        prisma.studySession.findUniqueOrThrow({ where: { id: missedSessionId } }),
        prisma.studySession.count({
          where: {
            taskId: thirdTaskId,
            status: StudySessionStatus.SCHEDULED,
            startAt: { gt: new Date() },
          },
        }),
        prisma.progressSnapshot.count({ where: { goalId } }),
        prisma.notification.count({ where: { userId } }),
      ]);
      if (
        missed.status === StudySessionStatus.MISSED &&
        replacement > 0 &&
        snapshots > 0 &&
        notifications > 0
      ) {
        const notificationResponse = await request(server)
          .get('/api/v1/notifications')
          .set({ authorization })
          .expect(200);
        const notification = parse<Array<{ id: string }>>(notificationResponse.text).data[0]!;
        await request(server)
          .post(`/api/v1/notifications/${notification.id}/read`)
          .set({ authorization })
          .send({})
          .expect(200);
        return;
      }
      observed = {
        jobState: await adaptiveJob.getState(),
        failedReason: adaptiveJob.failedReason,
        missedStatus: missed.status,
        replacement,
        snapshots,
        notifications,
      };
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Adaptive daily processing did not complete: ${JSON.stringify(observed)}`);
  }, 20_000);

  async function waitForScheduleJob(id: string): Promise<void> {
    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      const response = await request(server)
        .get(`/api/v1/schedules/jobs/${id}`)
        .set({ authorization })
        .expect(200);
      const job = parse<JobView>(response.text).data;
      if (job.status === 'COMPLETED') return;
      if (job.status === 'FAILED') throw new Error(`Schedule job failed: ${response.text}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Schedule job ${id} did not complete within 15 seconds.`);
  }
});
