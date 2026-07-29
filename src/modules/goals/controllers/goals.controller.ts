import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CreateGoalDto } from '../dto/create-goal.dto';
import { ListGoalsQueryDto } from '../dto/list-goals-query.dto';
import { UpdateGoalDto } from '../dto/update-goal.dto';
import { GoalsService } from '../services/goals.service';
import { RoadmapGenerationService } from '@/modules/roadmap-jobs/services/roadmap-generation.service';

@ApiTags('Goals')
@ApiBearerAuth()
@Controller('goals')
export class GoalsController {
  constructor(
    private readonly goals: GoalsService,
    private readonly generation: RoadmapGenerationService,
  ) {}
  @Get() @ApiOperation({ summary: 'List current-user learning goals' }) list(
    @CurrentUser('id') userId: string,
    @Query() query: ListGoalsQueryDto,
  ) {
    return this.goals.list(userId, query.status);
  }
  @Post() @ApiOperation({ summary: 'Create a learning goal' }) create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateGoalDto,
  ) {
    return this.goals.create(userId, dto);
  }
  @Get(':id') @ApiOperation({ summary: 'Get a current-user learning goal' }) get(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.goals.get(userId, id);
  }
  @Patch(':id') @ApiOperation({ summary: 'Update a learning goal' }) update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.goals.update(userId, id, dto);
  }
  @Delete(':id') @ApiOperation({ summary: 'Soft-delete a learning goal' }) delete(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.goals.delete(userId, id);
  }
  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause an active learning goal' })
  pause(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.goals.pause(userId, id);
  }
  @Post(':id/resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resume a paused learning goal' })
  resume(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.goals.resume(userId, id);
  }

  @Post(':id/generate-roadmap')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Queue asynchronous roadmap generation' })
  generateRoadmap(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.generation.start(userId, id);
  }
}
