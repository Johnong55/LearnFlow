import type { AxiosRequestConfig } from "axios";

import { apiClient, unwrap } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";

export type ProgressPace = "AHEAD" | "ON_TRACK" | "DELAYED";

export type ProgressDay = {
  date: string;
  plannedMinutes: number;
  actualMinutes: number;
  completedSessions: number;
};

export type ProgressMetrics = {
  plannedLearningMinutes: number;
  actualLearningMinutes: number;
  taskCompletionRate: number;
  milestoneCompletionRate: number;
  scheduleAdherenceRate: number;
  currentStreak: number;
  weeklyConsistency: number;
  estimatedCompletionDate: string;
  scheduleVarianceDays: number;
  pace: ProgressPace;
  completedTasks: number;
  totalTasks: number;
  completedMilestones: number;
  totalMilestones: number;
  weekly: ProgressDay[];
};

export type GoalProgress = {
  goal: { id: string; title: string; targetDate: string };
  roadmapId: string | null;
  metrics: ProgressMetrics;
};

export type ProgressOverview = {
  goals: GoalProgress[];
  totals: {
    plannedLearningMinutes: number;
    actualLearningMinutes: number;
    completedTasks: number;
    totalTasks: number;
  };
};

export type WeeklyProgress = {
  goals: Array<{
    goal: GoalProgress["goal"];
    currentStreak: number;
    weeklyConsistency: number;
    scheduleAdherenceRate: number;
    days: ProgressDay[];
  }>;
};

const config = (signal?: AbortSignal): AxiosRequestConfig =>
  signal ? { signal } : {};

export const progressApi = {
  overview: (signal?: AbortSignal): Promise<ProgressOverview> =>
    unwrap(
      apiClient.get<ApiResponse<ProgressOverview>>(
        "/progress/overview",
        config(signal),
      ),
    ),
  weekly: (signal?: AbortSignal): Promise<WeeklyProgress> =>
    unwrap(
      apiClient.get<ApiResponse<WeeklyProgress>>(
        "/progress/weekly",
        config(signal),
      ),
    ),
  goal: (id: string, signal?: AbortSignal): Promise<GoalProgress> =>
    unwrap(
      apiClient.get<ApiResponse<GoalProgress>>(
        `/progress/goals/${id}`,
        config(signal),
      ),
    ),
};
