import { BadRequestException, Injectable } from '@nestjs/common';
import { ConstraintPriority, DayOfWeek, RoutineType, UserSkillType } from '@prisma/client';
import { AuditService } from '@/infrastructure/logging/audit.service';
import { SkillsService } from '@/modules/skills/services/skills.service';
import type { LearningPreferencesDto } from '../dto/learning-preferences.dto';
import type { LifeRoutineDto } from '../dto/life-routine.dto';
import type { PersonalProfileDto } from '../dto/personal-profile.dto';
import type { WorkScheduleDto } from '../dto/work-schedule.dto';
import { OnboardingRepository } from '../repositories/onboarding.repository';

const allWeekdays = Object.values(DayOfWeek);

@Injectable()
export class OnboardingService {
  constructor(
    private readonly repository: OnboardingRepository,
    private readonly skills: SkillsService,
    private readonly audit: AuditService,
  ) {}

  async status(userId: string) {
    const progress = await this.repository.findByUserId(userId);
    const completedSteps = progress
      ? [
          progress.personalProfile && 'personal-profile',
          progress.workSchedule && 'work-schedule',
          progress.lifeRoutine && 'life-routine',
          progress.learningPreferences && 'learning-preferences',
        ].filter(Boolean)
      : [];
    return {
      completed: Boolean(progress?.completedAt),
      currentStep: progress?.currentStep ?? 1,
      completedSteps,
      missingSteps: [
        'personal-profile',
        'work-schedule',
        'life-routine',
        'learning-preferences',
      ].filter((step) => !completedSteps.includes(step)),
      completedAt: progress?.completedAt ?? null,
    };
  }

  async get(userId: string) {
    return (
      (await this.repository.findByUserId(userId)) ?? {
        userId,
        currentStep: 1,
        personalProfile: null,
        workSchedule: null,
        lifeRoutine: null,
        learningPreferences: null,
        completedAt: null,
      }
    );
  }

  async savePersonalProfile(userId: string, dto: PersonalProfileDto) {
    this.assertTimezone(dto.timezone);
    return this.save(userId, 'personalProfile', dto, 2, 'ONBOARDING_PERSONAL_PROFILE_SAVED');
  }

  saveWorkSchedule(userId: string, dto: WorkScheduleDto) {
    if (dto.startTime === dto.endTime)
      throw new BadRequestException('Work start and end times must differ.');
    return this.save(userId, 'workSchedule', dto, 3, 'ONBOARDING_WORK_SCHEDULE_SAVED');
  }

  saveLifeRoutine(userId: string, dto: LifeRoutineDto) {
    for (const activity of dto.activities) {
      if (activity.startTime === activity.endTime)
        throw new BadRequestException(
          `Routine "${activity.title}" must have different start and end times.`,
        );
      if (
        activity.minimumDurationMinutes &&
        activity.preferredDurationMinutes &&
        activity.minimumDurationMinutes > activity.preferredDurationMinutes
      ) {
        throw new BadRequestException(
          `Routine "${activity.title}" has a minimum duration greater than its preferred duration.`,
        );
      }
    }
    return this.save(userId, 'lifeRoutine', dto, 4, 'ONBOARDING_LIFE_ROUTINE_SAVED');
  }

  saveLearningPreferences(userId: string, dto: LearningPreferencesDto) {
    if (dto.expectedDeadline <= new Date())
      throw new BadRequestException('Expected deadline must be in the future.');
    const desiredNames = dto.desiredSkills.map((skill) => skill.name.trim().toLocaleLowerCase());
    if (new Set(desiredNames).size !== desiredNames.length)
      throw new BadRequestException('Desired skills must be unique.');
    for (const skill of dto.desiredSkills)
      this.skills.assertLevelProgression(skill.currentLevel, skill.targetLevel);
    return this.save(
      userId,
      'learningPreferences',
      dto,
      5,
      'ONBOARDING_LEARNING_PREFERENCES_SAVED',
    );
  }

  async complete(userId: string) {
    const progress = await this.repository.findByUserId(userId);
    if (
      !progress?.personalProfile ||
      !progress.workSchedule ||
      !progress.lifeRoutine ||
      !progress.learningPreferences
    ) {
      throw new BadRequestException('All onboarding steps must be completed before submission.');
    }
    const personal = progress.personalProfile as unknown as PersonalProfileDto;
    const work = progress.workSchedule as unknown as WorkScheduleDto;
    const life = progress.lifeRoutine as unknown as LifeRoutineDto;
    const learning = progress.learningPreferences as unknown as LearningPreferencesDto;
    this.assertTimezone(personal.timezone);

    for (const current of learning.currentSkills ?? []) {
      await this.skills.upsertForUser(userId, {
        name: current.name,
        type: UserSkillType.CURRENT,
        currentLevel: current.level,
        confidenceLevel: current.confidenceLevel,
      });
    }
    const currentSkillNames = new Set(
      (learning.currentSkills ?? []).map((skill) => skill.name.trim().toLocaleLowerCase()),
    );
    for (const desired of learning.desiredSkills) {
      await this.skills.upsertForUser(userId, {
        name: desired.name,
        type: currentSkillNames.has(desired.name.trim().toLocaleLowerCase())
          ? UserSkillType.BOTH
          : UserSkillType.TARGET,
        currentLevel: desired.currentLevel,
        targetLevel: desired.targetLevel,
      });
    }

    const routines = [
      this.repository.buildSystemRoutine(
        userId,
        RoutineType.SLEEP,
        'Sleep',
        allWeekdays,
        personal.sleepTime,
        personal.wakeUpTime,
      ),
      this.repository.buildSystemRoutine(
        userId,
        RoutineType.WORK,
        'Work',
        work.workingDays,
        work.startTime,
        work.endTime,
        {
          isFlexible: work.flexibleHours ?? false,
          constraintPriority: work.flexibleHours
            ? ConstraintPriority.SOFT
            : ConstraintPriority.HARD,
        },
      ),
      ...life.activities.map((activity) =>
        this.repository.buildSystemRoutine(
          userId,
          activity.type,
          activity.title,
          activity.weekdays,
          activity.startTime,
          activity.endTime,
          {
            isFlexible: activity.isFlexible,
            constraintPriority: activity.constraintPriority,
            priority: activity.priority,
            minimumDurationMinutes: activity.minimumDurationMinutes,
            preferredDurationMinutes: activity.preferredDurationMinutes,
            bufferBeforeMinutes: activity.bufferBeforeMinutes,
            bufferAfterMinutes: activity.bufferAfterMinutes,
          },
        ),
      ),
    ];

    const result = await this.repository.complete(
      userId,
      {
        occupation: personal.occupation,
        jobTitle: personal.jobTitle,
        timezone: personal.timezone,
        locale: personal.locale,
      },
      {
        preferredStudyDays: { set: learning.preferredStudyDays },
        preferredSessionMinutes: learning.preferredSessionMinutes,
        preferredLearningFormat: learning.preferredLearningFormat,
        maxCognitiveLoad: learning.maximumCognitiveWorkload,
      },
      routines,
    );
    void this.audit.record({
      userId,
      action: 'ONBOARDING_COMPLETED',
      entityType: 'OnboardingProgress',
      entityId: result.id,
    });
    return { completed: true, completedAt: result.completedAt };
  }

  private async save(
    userId: string,
    field: 'personalProfile' | 'workSchedule' | 'lifeRoutine' | 'learningPreferences',
    dto: object,
    nextStep: number,
    action: string,
  ) {
    const existing = await this.repository.findByUserId(userId);
    const result = await this.repository.saveStep(
      userId,
      field,
      dto,
      Math.max(existing?.currentStep ?? 1, nextStep),
    );
    void this.audit.record({
      userId,
      action,
      entityType: 'OnboardingProgress',
      entityId: result.id,
    });
    return result;
  }

  private assertTimezone(timezone: string): void {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
    } catch {
      throw new BadRequestException(
        'Timezone must be a valid IANA timezone, such as Asia/Ho_Chi_Minh.',
      );
    }
  }
}
