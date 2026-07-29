import type { SkillLevel, UserSkillType } from '@prisma/client';

export interface UpsertUserSkillInput {
  name: string;
  category?: string;
  type?: UserSkillType;
  currentLevel?: SkillLevel;
  targetLevel?: SkillLevel;
  confidenceLevel?: number;
  lastPracticedAt?: Date;
}
