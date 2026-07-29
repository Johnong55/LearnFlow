import { Module } from '@nestjs/common';
import { LoggingModule } from '@/infrastructure/logging/logging.module';
import { SchedulingModule } from '@/modules/scheduling/scheduling.module';
import { SessionsController } from './controllers/sessions.controller';
import { TasksController } from './controllers/tasks.controller';
import { SessionsRepository } from './repositories/sessions.repository';
import { SessionsService } from './services/sessions.service';

@Module({
  imports: [SchedulingModule, LoggingModule],
  controllers: [SessionsController, TasksController],
  providers: [SessionsRepository, SessionsService],
  exports: [SessionsRepository, SessionsService],
})
export class SessionsModule {}
