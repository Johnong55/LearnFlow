import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ScheduleRequestDto } from '../dto/schedule-request.dto';
import { SchedulingService } from '../services/scheduling.service';

@ApiTags('Scheduling')
@ApiBearerAuth()
@Controller('schedules')
export class SchedulingController {
  constructor(private readonly scheduling: SchedulingService) {}

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Preview a deterministic schedule without saving it' })
  preview(@CurrentUser('id') userId: string, @Body() dto: ScheduleRequestDto) {
    return this.scheduling.preview(userId, dto);
  }

  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Queue schedule generation and persistence' })
  generate(@CurrentUser('id') userId: string, @Body() dto: ScheduleRequestDto) {
    return this.scheduling.generate(userId, dto);
  }

  @Post('rebalance')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Queue deterministic schedule rebalancing' })
  rebalance(@CurrentUser('id') userId: string, @Body() dto: ScheduleRequestDto) {
    return this.scheduling.rebalance(userId, dto);
  }

  @Get('conflicts')
  @ApiOperation({ summary: 'List unresolved scheduling conflicts' })
  conflicts(@CurrentUser('id') userId: string) {
    return this.scheduling.conflicts(userId);
  }

  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Get schedule generation job progress' })
  job(@CurrentUser('id') userId: string, @Param('jobId', ParseUUIDPipe) jobId: string) {
    return this.scheduling.getJob(userId, jobId);
  }
}
