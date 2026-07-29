import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CalendarDateQueryDto } from '../dto/calendar-date-query.dto';
import { CalendarRangeQueryDto } from '../dto/calendar-range-query.dto';
import { CreateCalendarEventDto } from '../dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from '../dto/update-calendar-event.dto';
import { CalendarService } from '../services/calendar.service';

@ApiTags('Calendar')
@ApiBearerAuth()
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  @Get()
  @ApiOperation({ summary: 'List calendar events and study sessions in a UTC range' })
  list(@CurrentUser('id') userId: string, @Query() query: CalendarRangeQueryDto) {
    return this.calendar.list(userId, query);
  }

  @Get('day')
  @ApiOperation({ summary: 'Get one local calendar day' })
  day(@CurrentUser('id') userId: string, @Query() query: CalendarDateQueryDto) {
    return this.calendar.day(userId, query.date);
  }

  @Get('week')
  @ApiOperation({ summary: 'Get seven local calendar days' })
  week(@CurrentUser('id') userId: string, @Query() query: CalendarDateQueryDto) {
    return this.calendar.week(userId, query.date);
  }

  @Post('events')
  @ApiOperation({ summary: 'Create a fixed or flexible calendar event' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateCalendarEventDto) {
    return this.calendar.create(userId, dto);
  }

  @Patch('events/:id')
  @ApiOperation({ summary: 'Update an owned calendar event' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCalendarEventDto,
  ) {
    return this.calendar.update(userId, id, dto);
  }

  @Delete('events/:id')
  @ApiOperation({ summary: 'Soft-delete an owned calendar event' })
  delete(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.calendar.delete(userId, id);
  }
}
