import {
  Body,
  Controller,
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
import { RoadmapVersionQueryDto } from '../dto/roadmap-version-query.dto';
import { UpdateRoadmapDto } from '../dto/update-roadmap.dto';
import { RoadmapsService } from '../services/roadmaps.service';

@ApiTags('Roadmaps')
@ApiBearerAuth()
@Controller('roadmaps')
export class RoadmapsController {
  constructor(private readonly roadmaps: RoadmapsService) {}
  @Get() @ApiOperation({ summary: 'List current-user roadmaps' }) list(
    @CurrentUser('id') userId: string,
  ) {
    return this.roadmaps.list(userId);
  }
  @Get(':id') @ApiOperation({ summary: 'Get a roadmap and a selected/latest version' }) get(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: RoadmapVersionQueryDto,
  ) {
    return this.roadmaps.get(userId, id, query.version);
  }
  @Patch(':id') @ApiOperation({ summary: 'Update roadmap metadata' }) update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoadmapDto,
  ) {
    return this.roadmaps.update(userId, id, dto);
  }
  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate the latest roadmap version' })
  activate(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.roadmaps.activate(userId, id);
  }
  @Post(':id/regenerate')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Generate a new roadmap version asynchronously' })
  regenerate(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.roadmaps.regenerate(userId, id);
  }
  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a roadmap and its versions' })
  archive(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.roadmaps.archive(userId, id);
  }
  @Get(':id/sources') @ApiOperation({ summary: 'List sources for a roadmap version' }) sources(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: RoadmapVersionQueryDto,
  ) {
    return this.roadmaps.sources(userId, id, query.version);
  }
  @Get(':id/progress') @ApiOperation({ summary: 'Get task-level roadmap progress' }) progress(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.roadmaps.progress(userId, id);
  }
}
