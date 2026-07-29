import { Module } from '@nestjs/common';
import { RoutinesController } from './controllers/routines.controller';
import { RoutinesRepository } from './repositories/routines.repository';
import { RoutinesService } from './services/routines.service';

@Module({
  controllers: [RoutinesController],
  providers: [RoutinesRepository, RoutinesService],
  exports: [RoutinesService],
})
export class RoutinesModule {}
