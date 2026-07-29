import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CreateSkillDto } from '../dto/create-skill.dto';
import { UpdateSkillDto } from '../dto/update-skill.dto';
import { SkillsService } from '../services/skills.service';

@ApiTags('Skills')
@ApiBearerAuth()
@Controller('skills')
export class SkillsController {
  constructor(private readonly skills: SkillsService) {}
  @Get() @ApiOperation({ summary: 'List current-user skills' }) list(
    @CurrentUser('id') userId: string,
  ) {
    return this.skills.list(userId);
  }
  @Post() @ApiOperation({ summary: 'Add or restore a current-user skill' }) create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSkillDto,
  ) {
    return this.skills.create(userId, dto);
  }
  @Get(':id') @ApiOperation({ summary: 'Get a current-user skill' }) get(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.skills.get(userId, id);
  }
  @Patch(':id') @ApiOperation({ summary: 'Update a current-user skill' }) update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSkillDto,
  ) {
    return this.skills.update(userId, id, dto);
  }
  @Delete(':id') @ApiOperation({ summary: 'Soft-delete a current-user skill' }) delete(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.skills.delete(userId, id);
  }
}
