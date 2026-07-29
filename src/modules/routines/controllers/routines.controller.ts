import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CreateRoutineDto } from '../dto/create-routine.dto';
import { UpdateRoutineDto } from '../dto/update-routine.dto';
import { RoutinesService } from '../services/routines.service';

@ApiTags('Routines')
@ApiBearerAuth()
@Controller('routines')
export class RoutinesController {
  constructor(private readonly routines: RoutinesService) {}
  @Get() @ApiOperation({ summary: 'List recurring routines' }) list(
    @CurrentUser('id') userId: string,
  ) {
    return this.routines.list(userId);
  }
  @Post() @ApiOperation({ summary: 'Create a recurring routine' }) create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRoutineDto,
  ) {
    return this.routines.create(userId, dto);
  }
  @Patch(':id') @ApiOperation({ summary: 'Update a recurring routine' }) update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoutineDto,
  ) {
    return this.routines.update(userId, id, dto);
  }
  @Delete(':id') @ApiOperation({ summary: 'Soft-delete a recurring routine' }) delete(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.routines.delete(userId, id);
  }
}
