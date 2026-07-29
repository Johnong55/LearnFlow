import { Module } from '@nestjs/common';
import { CalendarController } from './controllers/calendar.controller';
import { CalendarRepository } from './repositories/calendar.repository';
import { CalendarService } from './services/calendar.service';

@Module({
  controllers: [CalendarController],
  providers: [CalendarRepository, CalendarService],
  exports: [CalendarRepository, CalendarService],
})
export class CalendarModule {}
