import { Injectable } from '@nestjs/common';
import { ConstraintPriority, Prisma, RoutineType } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';

type StepField = 'personalProfile' | 'workSchedule' | 'lifeRoutine' | 'learningPreferences';

export interface CompletionProfile {
  occupation: string;
  jobTitle?: string;
  timezone: string;
  locale?: string;
}

export interface CompletionPreference {
  preferredStudyDays: Prisma.UserPreferenceUpdateInput['preferredStudyDays'];
  preferredSessionMinutes: number;
  preferredLearningFormat: Prisma.UserPreferenceUpdateInput['preferredLearningFormat'];
  maxCognitiveLoad: number;
}

@Injectable()
export class OnboardingRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: string) {
    return this.prisma.onboardingProgress.findUnique({ where: { userId } });
  }

  saveStep(userId: string, field: StepField, value: object, currentStep: number) {
    const json = this.toJson(value);
    return this.prisma.onboardingProgress.upsert({
      where: { userId },
      create: { userId, currentStep, [field]: json },
      update: { currentStep, [field]: json, completedAt: null },
    });
  }

  async complete(
    userId: string,
    profile: CompletionProfile,
    preference: CompletionPreference,
    routines: Prisma.RoutineCreateManyInput[],
  ) {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.routine.deleteMany({ where: { userId, source: 'ONBOARDING' } });
      if (routines.length) await transaction.routine.createMany({ data: routines });
      const completedAt = new Date();
      await transaction.userProfile.update({
        where: { userId },
        data: {
          occupation: profile.occupation,
          jobTitle: profile.jobTitle,
          timezone: profile.timezone,
          locale: profile.locale,
        },
      });
      await transaction.userPreference.update({ where: { userId }, data: preference });
      await transaction.user.update({
        where: { id: userId },
        data: { onboardingCompletedAt: completedAt },
      });
      return transaction.onboardingProgress.update({
        where: { userId },
        data: { currentStep: 5, completedAt },
      });
    });
  }

  buildSystemRoutine(
    userId: string,
    type: RoutineType,
    title: string,
    weekdays: Prisma.RoutineCreateManyInput['weekdays'],
    startTime: string,
    endTime: string,
    extra: Partial<Prisma.RoutineCreateManyInput> = {},
  ): Prisma.RoutineCreateManyInput {
    return {
      userId,
      type,
      title,
      weekdays,
      startTime,
      endTime,
      constraintPriority: ConstraintPriority.HARD,
      source: 'ONBOARDING',
      ...extra,
    };
  }

  private toJson(value: object): Prisma.InputJsonObject {
    const parsed = JSON.parse(JSON.stringify(value)) as unknown;
    return parsed as Prisma.InputJsonObject;
  }
}
