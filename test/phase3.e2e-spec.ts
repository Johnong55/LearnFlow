import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import { INestApplication, INestApplicationContext, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { WorkerModule } from '@/worker.module';

interface Envelope<T> {
  data: T;
}
interface JobView {
  jobId: string;
  status: string;
  progress: number;
  result?: { roadmapId?: string; version?: number };
}
const parse = <T>(text: string): Envelope<T> => JSON.parse(text) as Envelope<T>;

describe('Phase 3 asynchronous roadmap pipeline (e2e)', () => {
  let app: INestApplication;
  let worker: INestApplicationContext;
  let server: Server;
  let prisma: PrismaService;
  const runId = randomUUID();
  const email = `phase3-e2e-${runId}@example.test`;
  const skillName = `Phase 3 E2E Skill ${runId}`;
  const jobIds: string[] = [];

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
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.backgroundJob.deleteMany({ where: { id: { in: jobIds } } });
    await prisma.skill.deleteMany({ where: { name: skillName } });
    await worker.close();
    await app.close();
  });

  it('generates and regenerates immutable, source-grounded roadmap versions', async () => {
    const registration = await request(server)
      .post('/api/v1/auth/register')
      .send({ email, fullName: 'Phase Three E2E', password: 'Phase-3-E2E-Password-42' })
      .expect(201);
    const accessToken = parse<{ tokens: { accessToken: string } }>(registration.text).data.tokens
      .accessToken;
    const auth = { authorization: `Bearer ${accessToken}` };

    const goalResponse = await request(server)
      .post('/api/v1/goals')
      .set(auth)
      .send({
        title: 'Generate a versioned learning roadmap',
        description: 'Exercise the complete asynchronous mock search and LLM pipeline.',
        skillName,
        currentLevel: 'BEGINNER',
        targetLevel: 'ADVANCED',
        targetDate: new Date(Date.now() + 84 * 86_400_000).toISOString(),
        priority: 'HIGH',
        weeklyAvailableHours: 8,
        successCriteria: ['A source-grounded roadmap is generated'],
      })
      .expect(201);
    const goalId = parse<{ id: string }>(goalResponse.text).data.id;

    const [firstStart, duplicateStart] = await Promise.all([
      request(server).post(`/api/v1/goals/${goalId}/generate-roadmap`).set(auth).expect(202),
      request(server).post(`/api/v1/goals/${goalId}/generate-roadmap`).set(auth).expect(202),
    ]);
    const firstJobId = parse<JobView>(firstStart.text).data.jobId;
    expect(parse<JobView>(duplicateStart.text).data.jobId).toBe(firstJobId);
    jobIds.push(firstJobId);
    const firstJob = await waitForCompletion(firstJobId, auth.authorization);
    expect(firstJob.progress).toBe(100);
    expect(firstJob.result?.version).toBe(1);
    const roadmapId = firstJob.result?.roadmapId;
    expect(roadmapId).toBeDefined();

    const sources = await request(server)
      .get(`/api/v1/roadmaps/${roadmapId}/sources`)
      .set(auth)
      .expect(200);
    expect(parse<unknown[]>(sources.text).data.length).toBeGreaterThan(0);

    const regeneration = await request(server)
      .post(`/api/v1/roadmaps/${roadmapId}/regenerate`)
      .set(auth)
      .expect(202);
    const secondJobId = parse<JobView>(regeneration.text).data.jobId;
    jobIds.push(secondJobId);
    const secondJob = await waitForCompletion(secondJobId, auth.authorization);
    expect(secondJob.result?.version).toBe(2);

    await request(server)
      .get(`/api/v1/roadmaps/${roadmapId}?version=1`)
      .set(auth)
      .expect(200)
      .expect((response) => {
        expect(
          parse<{ versions: Array<{ version: number }> }>(response.text).data.versions[0]?.version,
        ).toBe(1);
      });
  }, 20_000);

  async function waitForCompletion(jobId: string, authorization: string): Promise<JobView> {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      const response = await request(server)
        .get(`/api/v1/roadmap-jobs/${jobId}`)
        .set({ authorization })
        .expect(200);
      const job = parse<JobView>(response.text).data;
      if (job.status === 'COMPLETED') return job;
      if (job.status === 'FAILED')
        throw new Error(`Roadmap pipeline failed: ${JSON.stringify(job)}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Roadmap job ${jobId} did not complete within 15 seconds.`);
  }
});
