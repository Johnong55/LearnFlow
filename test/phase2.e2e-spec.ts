import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/infrastructure/database/prisma.service';

interface Envelope<T> {
  data: T;
}

function parseEnvelope<T>(text: string): Envelope<T> {
  return JSON.parse(text) as Envelope<T>;
}

describe('Phase 2 API ownership flow (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: PrismaService;
  const runId = randomUUID();
  const firstEmail = `phase2-owner-${runId}@example.test`;
  const secondEmail = `phase2-other-${runId}@example.test`;
  const skillName = `Phase 2 E2E Skill ${runId}`;

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
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [firstEmail, secondEmail] } } });
    await prisma.skill.deleteMany({ where: { name: skillName } });
    await app.close();
  });

  it('saves onboarding and prevents cross-user goal access', async () => {
    const owner = await register(firstEmail, 'Phase Two Owner');
    const other = await register(secondEmail, 'Phase Two Other');

    await request(server)
      .put('/api/v1/onboarding/personal-profile')
      .set('authorization', `Bearer ${owner.accessToken}`)
      .send({
        occupation: 'Software developer',
        timezone: 'Asia/Ho_Chi_Minh',
        wakeUpTime: '06:30',
        sleepTime: '23:00',
      })
      .expect(200);

    await request(server)
      .get('/api/v1/onboarding/status')
      .set('authorization', `Bearer ${owner.accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = parseEnvelope<{ completedSteps: string[] }>(response.text);
        expect(body.data.completedSteps).toContain('personal-profile');
      });

    const goalResponse = await request(server)
      .post('/api/v1/goals')
      .set('authorization', `Bearer ${owner.accessToken}`)
      .send({
        title: 'Phase 2 ownership goal',
        description: 'Verify that another user cannot read this learning goal.',
        skillName,
        currentLevel: 'BEGINNER',
        targetLevel: 'ADVANCED',
        targetDate: new Date(Date.now() + 30 * 86_400_000).toISOString(),
        priority: 'HIGH',
        weeklyAvailableHours: 8,
        successCriteria: ['The protected goal remains private'],
      })
      .expect(201);

    const goal = parseEnvelope<{ id: string }>(goalResponse.text);
    await request(server)
      .get(`/api/v1/goals/${goal.data.id}`)
      .set('authorization', `Bearer ${other.accessToken}`)
      .expect(404);
  });

  async function register(email: string, fullName: string): Promise<{ accessToken: string }> {
    const response = await request(server)
      .post('/api/v1/auth/register')
      .send({ email, fullName, password: 'Phase-2-Integration-Password-42' })
      .expect(201);
    const body = parseEnvelope<{ tokens: { accessToken: string } }>(response.text);
    return { accessToken: body.data.tokens.accessToken };
  }
});
