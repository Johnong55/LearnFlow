import { Module } from '@nestjs/common';
import { RoadmapsModule } from '@/modules/roadmaps/roadmaps.module';
import { RoadmapWorker } from './roadmap.worker';

@Module({ imports: [RoadmapsModule], providers: [RoadmapWorker] })
export class RoadmapWorkersModule {}
