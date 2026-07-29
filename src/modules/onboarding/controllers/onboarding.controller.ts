import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { LearningPreferencesDto } from '../dto/learning-preferences.dto';
import { LifeRoutineDto } from '../dto/life-routine.dto';
import { PersonalProfileDto } from '../dto/personal-profile.dto';
import { WorkScheduleDto } from '../dto/work-schedule.dto';
import { OnboardingService } from '../services/onboarding.service';

@ApiTags('Onboarding')
@ApiBearerAuth()
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get onboarding completion status' })
  status(@CurrentUser('id') userId: string) {
    return this.onboarding.status(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get the complete onboarding draft' })
  get(@CurrentUser('id') userId: string) {
    return this.onboarding.get(userId);
  }

  @Put('personal-profile')
  @ApiOperation({ summary: 'Save personal profile onboarding step' })
  personal(@CurrentUser('id') userId: string, @Body() dto: PersonalProfileDto) {
    return this.onboarding.savePersonalProfile(userId, dto);
  }

  @Put('work-schedule')
  @ApiOperation({ summary: 'Save work schedule onboarding step' })
  work(@CurrentUser('id') userId: string, @Body() dto: WorkScheduleDto) {
    return this.onboarding.saveWorkSchedule(userId, dto);
  }

  @Put('life-routine')
  @ApiOperation({ summary: 'Save life routine onboarding step' })
  routine(@CurrentUser('id') userId: string, @Body() dto: LifeRoutineDto) {
    return this.onboarding.saveLifeRoutine(userId, dto);
  }

  @Put('learning-preferences')
  @ApiOperation({ summary: 'Save learning preferences onboarding step' })
  learning(@CurrentUser('id') userId: string, @Body() dto: LearningPreferencesDto) {
    return this.onboarding.saveLearningPreferences(userId, dto);
  }

  @Post('complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate and complete onboarding' })
  complete(@CurrentUser('id') userId: string) {
    return this.onboarding.complete(userId);
  }
}
