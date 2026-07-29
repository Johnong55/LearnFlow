import { Module } from '@nestjs/common';
import { SkillsController } from './controllers/skills.controller';
import { SkillsRepository } from './repositories/skills.repository';
import { SkillsService } from './services/skills.service';

@Module({
  controllers: [SkillsController],
  providers: [SkillsRepository, SkillsService],
  exports: [SkillsService],
})
export class SkillsModule {}
