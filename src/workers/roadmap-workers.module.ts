import { Module } from '@nestjs/common';
import { RoadmapsModule } from '@/modules/roadmaps/roadmaps.module';
import { SchedulingModule } from '@/modules/scheduling/scheduling.module';
import { RoadmapWorker } from './roadmap.worker';

@Module({ imports: [RoadmapsModule, SchedulingModule], providers: [RoadmapWorker] })
export class RoadmapWorkersModule {}
