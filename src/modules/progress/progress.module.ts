import { Module } from '@nestjs/common';
import { ProgressController } from './controllers/progress.controller';
import { ProgressRepository } from './repositories/progress.repository';
import { ProgressService } from './services/progress.service';

@Module({
  controllers: [ProgressController],
  providers: [ProgressRepository, ProgressService],
  exports: [ProgressRepository, ProgressService],
})
export class ProgressModule {}
