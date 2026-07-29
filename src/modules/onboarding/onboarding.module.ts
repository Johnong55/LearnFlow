import { Module } from '@nestjs/common';
import { SkillsModule } from '../skills/skills.module';
import { OnboardingController } from './controllers/onboarding.controller';
import { OnboardingRepository } from './repositories/onboarding.repository';
import { OnboardingService } from './services/onboarding.service';

@Module({
  imports: [SkillsModule],
  controllers: [OnboardingController],
  providers: [OnboardingRepository, OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
