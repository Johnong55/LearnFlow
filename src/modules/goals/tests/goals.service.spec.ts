import { NotFoundException } from '@nestjs/common';
import { AuditService } from '@/infrastructure/logging/audit.service';
import { SkillsService } from '@/modules/skills/services/skills.service';
import { GoalsRepository } from '../repositories/goals.repository';
import { GoalsService } from '../services/goals.service';

describe('GoalsService ownership', () => {
  it('does not expose a goal that is not owned by the current user', async () => {
    const repository = { findOwned: jest.fn().mockResolvedValue(null) };
    const service = new GoalsService(
      repository as unknown as GoalsRepository,
      {} as SkillsService,
      {} as AuditService,
    );
    await expect(service.get('user-a', 'goal-owned-by-user-b')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.findOwned).toHaveBeenCalledWith('user-a', 'goal-owned-by-user-b');
  });
});
