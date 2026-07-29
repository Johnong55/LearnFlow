import { Module } from '@nestjs/common';
import { LlmModule } from '@/infrastructure/external/llm/llm.module';
import { SearchModule } from '@/infrastructure/external/search/search.module';
import { RoadmapQueueModule } from '@/infrastructure/queue/roadmap-queue.module';
import { LoggingModule } from '@/infrastructure/logging/logging.module';
import { RoadmapJobsController } from '../roadmap-jobs/controllers/roadmap-jobs.controller';
import { RoadmapJobsRepository } from '../roadmap-jobs/repositories/roadmap-jobs.repository';
import { RoadmapGenerationService } from '../roadmap-jobs/services/roadmap-generation.service';
import { RoadmapsController } from './controllers/roadmaps.controller';
import { RoadmapsRepository } from './repositories/roadmaps.repository';
import { RoadmapsService } from './services/roadmaps.service';

@Module({
  imports: [RoadmapQueueModule, SearchModule, LlmModule, LoggingModule],
  controllers: [RoadmapsController, RoadmapJobsController],
  providers: [RoadmapsRepository, RoadmapJobsRepository, RoadmapGenerationService, RoadmapsService],
  exports: [RoadmapsRepository, RoadmapJobsRepository, RoadmapGenerationService, RoadmapsService],
})
export class RoadmapsModule {}
