import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ProgressService } from '../services/progress.service';

@ApiTags('Progress')
@ApiBearerAuth()
@Controller('progress')
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get aggregate and per-goal progress metrics' })
  overview(@CurrentUser('id') userId: string) {
    return this.progress.overview(userId);
  }

  @Get('weekly')
  @ApiOperation({ summary: 'Get seven-day consistency and adherence metrics' })
  weekly(@CurrentUser('id') userId: string) {
    return this.progress.weekly(userId);
  }

  @Get('goals/:goalId')
  @ApiOperation({ summary: 'Get detailed progress and estimated completion for an owned goal' })
  goal(@CurrentUser('id') userId: string, @Param('goalId', ParseUUIDPipe) goalId: string) {
    return this.progress.goal(userId, goalId);
  }
}
