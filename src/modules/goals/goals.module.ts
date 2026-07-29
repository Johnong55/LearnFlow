import { Module } from '@nestjs/common';
import { SkillsModule } from '../skills/skills.module';
import { RoadmapsModule } from '../roadmaps/roadmaps.module';
import { GoalsController } from './controllers/goals.controller';
import { GoalsRepository } from './repositories/goals.repository';
import { GoalsService } from './services/goals.service';

@Module({
  imports: [SkillsModule, RoadmapsModule],
  controllers: [GoalsController],
  providers: [GoalsRepository, GoalsService],
  exports: [GoalsService],
})
export class GoalsModule {}
