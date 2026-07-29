import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { SCHEDULE_QUEUE } from '@/infrastructure/queue/schedule-queue.constants';
import { SchedulingController } from './controllers/scheduling.controller';
import { SchedulingEngine } from './domain/scheduling.engine';
import { ScheduleJobsRepository } from './repositories/schedule-jobs.repository';
import { SchedulingRepository } from './repositories/scheduling.repository';
import { SchedulingService } from './services/scheduling.service';

@Module({
  imports: [BullModule.registerQueue({ name: SCHEDULE_QUEUE })],
  controllers: [SchedulingController],
  providers: [SchedulingEngine, SchedulingRepository, ScheduleJobsRepository, SchedulingService],
  exports: [SchedulingEngine, SchedulingRepository, ScheduleJobsRepository, SchedulingService],
})
export class SchedulingModule {}
