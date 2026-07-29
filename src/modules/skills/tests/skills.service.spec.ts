import { BadRequestException } from '@nestjs/common';
import { SkillLevel } from '@prisma/client';
import { AuditService } from '@/infrastructure/logging/audit.service';
import { SkillsRepository } from '../repositories/skills.repository';
import { SkillsService } from '../services/skills.service';

describe('SkillsService', () => {
  const repository = {} as SkillsRepository;
  const audit = {} as AuditService;
  const service = new SkillsService(repository, audit);

  it('requires target level to be higher than current level', () => {
    expect(() =>
      service.assertLevelProgression(SkillLevel.INTERMEDIATE, SkillLevel.BEGINNER),
    ).toThrow(BadRequestException);
  });

  it('accepts valid level progression', () => {
    expect(() =>
      service.assertLevelProgression(SkillLevel.BEGINNER, SkillLevel.ADVANCED),
    ).not.toThrow();
  });
});
