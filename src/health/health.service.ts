import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client';
import type { Queue } from 'bullmq';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '@/infrastructure/cache/redis.constants';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { SYSTEM_QUEUE } from '@/infrastructure/queue/queue.constants';

export interface ReadinessResult {
  status: 'ok' | 'error';
  details: Record<'postgresql' | 'redis' | 'bullmq', { status: 'up' | 'down' }>;
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @InjectQueue(SYSTEM_QUEUE) private readonly queue: Queue,
  ) {}

  live() {
    return { status: 'ok', service: 'learnflow-api', uptimeSeconds: Math.floor(process.uptime()) };
  }

  async ready(): Promise<ReadinessResult> {
    const probes: Promise<unknown>[] = [
      this.prisma.$queryRaw<unknown>(Prisma.sql`SELECT 1`),
      this.ensureRedis().then(() => this.redis.ping()),
      this.queue.getJobCounts('waiting', 'active', 'failed'),
    ];
    const checks = await Promise.allSettled(probes);
    const names = ['postgresql', 'redis', 'bullmq'] as const;
    const details: ReadinessResult['details'] = {
      postgresql: { status: 'down' },
      redis: { status: 'down' },
      bullmq: { status: 'down' },
    };
    names.forEach((name, index) => {
      details[name].status = checks[index]?.status === 'fulfilled' ? 'up' : 'down';
    });
    return {
      status: checks.every((check) => check.status === 'fulfilled') ? 'ok' : 'error',
      details,
    };
  }

  private async ensureRedis(): Promise<void> {
    if (this.redis.status === 'wait') await this.redis.connect();
  }
}
