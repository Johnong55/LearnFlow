import type { AxiosRequestConfig } from "axios";

import type {
  DayOfWeek,
  LearningFormat,
  OnboardingServerDraft,
  OnboardingStatus,
  RoutineDraft,
  SkillLevel,
  WorkMode,
} from "@/features/onboarding/types";
import { apiClient, unwrap } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";

type PersonalProfileInput = {
  occupation: string;
  jobTitle?: string;
  timezone: string;
  locale?: string;
  wakeUpTime: string;
  sleepTime: string;
};

type WorkScheduleInput = {
  workingDays: DayOfWeek[];
  startTime: string;
  endTime: string;
  workMode: WorkMode;
  commuteMinutes: number;
  flexibleHours: boolean;
};

type LearningPreferencesInput = {
  desiredSkills: Array<{
    name: string;
    currentLevel: SkillLevel;
    targetLevel: SkillLevel;
  }>;
  learningGoal: string;
  expectedDeadline: string;
  hoursAvailablePerWeek: number;
  preferredStudyDays: DayOfWeek[];
  preferredSessionMinutes: number;
  preferredLearningFormat: LearningFormat;
  maximumCognitiveWorkload: number;
};

const config = (signal?: AbortSignal): AxiosRequestConfig =>
  signal ? { signal } : {};

export const onboardingApi = {
  status: (signal?: AbortSignal) =>
    unwrap(
      apiClient.get<ApiResponse<OnboardingStatus>>(
        "/onboarding/status",
        config(signal),
      ),
    ),
  detail: (signal?: AbortSignal) =>
    unwrap(
      apiClient.get<ApiResponse<OnboardingServerDraft>>(
        "/onboarding",
        config(signal),
      ),
    ),
  savePersonal: (input: PersonalProfileInput, signal?: AbortSignal) =>
    unwrap(
      apiClient.put<ApiResponse<OnboardingServerDraft>>(
        "/onboarding/personal-profile",
        input,
        config(signal),
      ),
    ),
  saveWork: (input: WorkScheduleInput, signal?: AbortSignal) =>
    unwrap(
      apiClient.put<ApiResponse<OnboardingServerDraft>>(
        "/onboarding/work-schedule",
        input,
        config(signal),
      ),
    ),
  saveRoutines: (routines: RoutineDraft[], signal?: AbortSignal) =>
    unwrap(
      apiClient.put<ApiResponse<OnboardingServerDraft>>(
        "/onboarding/life-routine",
        {
          activities: routines.map((routine) => ({
            type: routine.type,
            title: routine.title,
            weekdays: routine.weekdays,
            startTime: routine.startTime,
            endTime: routine.endTime,
            isFlexible: routine.isFlexible,
            constraintPriority: routine.constraintPriority,
            priority: routine.priority,
            minimumDurationMinutes: routine.minimumDurationMinutes,
            preferredDurationMinutes: routine.preferredDurationMinutes,
            bufferBeforeMinutes: routine.bufferBeforeMinutes,
            bufferAfterMinutes: routine.bufferAfterMinutes,
          })),
        },
        config(signal),
      ),
    ),
  saveLearning: (input: LearningPreferencesInput, signal?: AbortSignal) =>
    unwrap(
      apiClient.put<ApiResponse<OnboardingServerDraft>>(
        "/onboarding/learning-preferences",
        input,
        config(signal),
      ),
    ),
  complete: (signal?: AbortSignal) =>
    unwrap(
      apiClient.post<ApiResponse<{ completed: boolean; completedAt: string }>>(
        "/onboarding/complete",
        {},
        config(signal),
      ),
    ),
};
