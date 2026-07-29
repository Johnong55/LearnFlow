import { BadRequestException } from '@nestjs/common';
import { AuditService } from '@/infrastructure/logging/audit.service';
import { SkillsService } from '@/modules/skills/services/skills.service';
import { OnboardingRepository } from '../repositories/onboarding.repository';
import { OnboardingService } from '../services/onboarding.service';

describe('OnboardingService', () => {
  it('does not complete an incomplete draft', async () => {
    const repository = {
      findByUserId: jest.fn().mockResolvedValue({ personalProfile: {}, workSchedule: null }),
    };
    const service = new OnboardingService(
      repository as unknown as OnboardingRepository,
      {} as SkillsService,
      {} as AuditService,
    );
    await expect(service.complete('user-1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
