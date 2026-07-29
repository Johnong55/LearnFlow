import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CreateAvailabilityRuleDto } from '../dto/create-availability-rule.dto';
import { UpdateAvailabilityRuleDto } from '../dto/update-availability-rule.dto';
import { AvailabilityService } from '../services/availability.service';

@ApiTags('Availability')
@ApiBearerAuth()
@Controller('availability-rules')
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}
  @Get() @ApiOperation({ summary: 'List availability rules' }) list(
    @CurrentUser('id') userId: string,
  ) {
    return this.availability.list(userId);
  }
  @Post() @ApiOperation({ summary: 'Create an availability rule' }) create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAvailabilityRuleDto,
  ) {
    return this.availability.create(userId, dto);
  }
  @Patch(':id') @ApiOperation({ summary: 'Update an availability rule' }) update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAvailabilityRuleDto,
  ) {
    return this.availability.update(userId, id, dto);
  }
  @Delete(':id') @ApiOperation({ summary: 'Soft-delete an availability rule' }) delete(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.availability.delete(userId, id);
  }
}
