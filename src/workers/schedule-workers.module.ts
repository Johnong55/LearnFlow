import { Module } from '@nestjs/common';
import { SchedulingModule } from '@/modules/scheduling/scheduling.module';
import { ScheduleWorker } from './schedule.worker';

@Module({ imports: [SchedulingModule], providers: [ScheduleWorker] })
export class ScheduleWorkersModule {}
