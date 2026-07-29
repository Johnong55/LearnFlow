import type { SkillLevel, UserSkillType } from '@/generated/prisma/client';

export interface UpsertUserSkillInput {
  name: string;
  category?: string;
  type?: UserSkillType;
  currentLevel?: SkillLevel;
  targetLevel?: SkillLevel;
  confidenceLevel?: number;
  lastPracticedAt?: Date;
}
