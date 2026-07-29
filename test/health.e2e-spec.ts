import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';
import { HealthController } from '@/health/health.controller';
import { HealthService } from '@/health/health.service';

describe('Health API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: {
            live: () => ({ status: 'ok', service: 'learnflow-api', uptimeSeconds: 1 }),
            ready: () =>
              Promise.resolve({
                status: 'ok',
                details: {
                  postgresql: { status: 'up' },
                  redis: { status: 'up' },
                  bullmq: { status: 'up' },
                },
              }),
          },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    app.use((req: { requestId?: string }, _res: unknown, next: () => void) => {
      req.requestId = 'e2e-request';
      next();
    });
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterAll(async () => app.close());

  it('GET /health/live returns the standard envelope', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/health/live')
      .expect(200);
    expect(response.body).toMatchObject({
      success: true,
      data: { status: 'ok', service: 'learnflow-api' },
      meta: { requestId: 'e2e-request' },
    });
  });
});
