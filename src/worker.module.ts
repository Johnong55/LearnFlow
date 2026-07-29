import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configurations } from './config';
import { environmentSchema } from './config/env.validation';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { RedisModule } from './infrastructure/cache/redis.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { WorkersModule } from './workers/workers.module';
import { RoadmapWorkersModule } from './workers/roadmap-workers.module';
import { ScheduleWorkersModule } from './workers/schedule-workers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: configurations,
      validationSchema: environmentSchema,
      validationOptions: { abortEarly: false },
    }),
    PrismaModule,
    RedisModule,
    QueueModule,
    WorkersModule,
    RoadmapWorkersModule,
    ScheduleWorkersModule,
  ],
})
export class WorkerModule {}
