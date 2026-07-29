import { Module } from '@nestjs/common';
import { ProgressModule } from '@/modules/progress/progress.module';
import { SchedulingModule } from '@/modules/scheduling/scheduling.module';
import { AdaptiveSchedulingRepository } from '@/modules/scheduling/repositories/adaptive-scheduling.repository';
import { AdaptiveJobScheduler } from './adaptive-job.scheduler';
import { SystemWorker } from './system.worker';

@Module({
  imports: [SchedulingModule, ProgressModule],
  providers: [AdaptiveSchedulingRepository, AdaptiveJobScheduler, SystemWorker],
})
export class WorkersModule {}
