import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';
import { ADAPTIVE_DAILY_JOB, SYSTEM_QUEUE } from '@/infrastructure/queue/queue.constants';

@Injectable()
export class AdaptiveJobScheduler implements OnModuleInit {
  constructor(
    @InjectQueue(SYSTEM_QUEUE) private readonly queue: Queue,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.queue.add(
      ADAPTIVE_DAILY_JOB,
      {},
      {
        jobId: ADAPTIVE_DAILY_JOB,
        repeat: { pattern: this.config.get<string>('ADAPTIVE_SCHEDULE_CRON', '0 2 * * *') },
        removeOnComplete: 30,
        removeOnFail: 100,
      },
    );
  }
}
