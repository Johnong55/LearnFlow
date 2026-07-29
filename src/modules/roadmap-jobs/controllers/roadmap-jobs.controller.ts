import { Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { RoadmapGenerationService } from '../services/roadmap-generation.service';

@ApiTags('Roadmap Jobs')
@ApiBearerAuth()
@Controller('roadmap-jobs')
export class RoadmapJobsController {
  constructor(private readonly generation: RoadmapGenerationService) {}
  @Get(':jobId')
  @ApiOperation({ summary: 'Get roadmap generation progress' })
  get(@CurrentUser('id') userId: string, @Param('jobId', ParseUUIDPipe) jobId: string) {
    return this.generation.get(userId, jobId);
  }
  @Post(':jobId/retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retry a failed roadmap generation job' })
  retry(@CurrentUser('id') userId: string, @Param('jobId', ParseUUIDPipe) jobId: string) {
    return this.generation.retry(userId, jobId);
  }
}
