import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client';
import { AuditService } from '@/infrastructure/logging/audit.service';
import type { UpdateUserDto } from '../dto/update-user.dto';
import { UsersRepository } from '../repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly repository: UsersRepository,
    private readonly audit: AuditService,
  ) {}

  async getMe(userId: string) {
    const user = await this.repository.findById(userId);
    if (!user) throw new NotFoundException('User not found.');
    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    const profile: Prisma.UserProfileUpdateInput = {};
    const preference: Prisma.UserPreferenceUpdateInput = {};
    const profileKeys = [
      'fullName',
      'timezone',
      'locale',
      'dateOfBirth',
      'occupation',
      'jobTitle',
    ] as const;
    const preferenceKeys = [
      'preferredLearningStyle',
      'preferredSessionMinutes',
      'preferredStudyTime',
      'preferredStudyDays',
      'preferredLearningFormat',
      'maxDailyLearningMinutes',
      'maxCognitiveLoad',
      'notifications',
    ] as const;
    for (const key of profileKeys)
      if (dto[key] !== undefined) Object.assign(profile, { [key]: dto[key] });
    for (const key of preferenceKeys)
      if (dto[key] !== undefined) Object.assign(preference, { [key]: dto[key] });
    const user = await this.repository.update(userId, profile, preference);
    void this.audit.record({
      userId,
      action: 'USER_PROFILE_UPDATED',
      entityType: 'User',
      entityId: userId,
    });
    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  }

  async deleteMe(userId: string): Promise<{ message: string }> {
    await this.repository.softDelete(userId);
    void this.audit.record({
      userId,
      action: 'USER_ACCOUNT_DELETED',
      entityType: 'User',
      entityId: userId,
    });
    return { message: 'Account deleted successfully.' };
  }
}
