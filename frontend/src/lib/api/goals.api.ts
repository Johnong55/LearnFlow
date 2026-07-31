import type { AxiosRequestConfig } from "axios";

import type { GoalPriority, SkillLevel } from "@/features/onboarding/types";
import { apiClient, unwrap } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";

export type CreateGoalInput = {
  title: string;
  description: string;
  skillName: string;
  skillCategory?: string;
  currentLevel: SkillLevel;
  targetLevel: SkillLevel;
  targetDate: string;
  priority: GoalPriority;
  weeklyAvailableHours: number;
  successCriteria: string[];
  userConstraints: Record<string, unknown>;
};

export type GoalStatus =
  "DRAFT" | "ANALYZING" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";

export type LearningGoal = Omit<
  CreateGoalInput,
  "skillName" | "skillCategory"
> & {
  id: string;
  skillId: string;
  skill: { id: string; name: string; category: string | null };
  status: GoalStatus;
  weeklyAvailableHours: number | string;
  createdAt: string;
  updatedAt: string;
};

export type UpdateGoalInput = Partial<CreateGoalInput>;

export type GoalGenerationJob = {
  jobId: string;
  status: string;
  progress: number;
  message: string;
};

const config = (signal?: AbortSignal): AxiosRequestConfig =>
  signal ? { signal } : {};

export const goalsApi = {
  create(input: CreateGoalInput, signal?: AbortSignal): Promise<LearningGoal> {
    const config: AxiosRequestConfig = signal ? { signal } : {};
    return unwrap(
      apiClient.post<ApiResponse<LearningGoal>>("/goals", input, config),
    );
  },
  list(status?: GoalStatus, signal?: AbortSignal): Promise<LearningGoal[]> {
    return unwrap(
      apiClient.get<ApiResponse<LearningGoal[]>>("/goals", {
        ...config(signal),
        params: status ? { status } : undefined,
      }),
    );
  },
  detail(id: string, signal?: AbortSignal): Promise<LearningGoal> {
    return unwrap(
      apiClient.get<ApiResponse<LearningGoal>>(`/goals/${id}`, config(signal)),
    );
  },
  update(
    id: string,
    input: UpdateGoalInput,
    signal?: AbortSignal,
  ): Promise<LearningGoal> {
    return unwrap(
      apiClient.patch<ApiResponse<LearningGoal>>(
        `/goals/${id}`,
        input,
        config(signal),
      ),
    );
  },
  delete(id: string, signal?: AbortSignal): Promise<{ message: string }> {
    return unwrap(
      apiClient.delete<ApiResponse<{ message: string }>>(
        `/goals/${id}`,
        config(signal),
      ),
    );
  },
  pause(id: string, signal?: AbortSignal): Promise<LearningGoal> {
    return unwrap(
      apiClient.post<ApiResponse<LearningGoal>>(
        `/goals/${id}/pause`,
        {},
        config(signal),
      ),
    );
  },
  resume(id: string, signal?: AbortSignal): Promise<LearningGoal> {
    return unwrap(
      apiClient.post<ApiResponse<LearningGoal>>(
        `/goals/${id}/resume`,
        {},
        config(signal),
      ),
    );
  },
  generateRoadmap(
    id: string,
    signal?: AbortSignal,
  ): Promise<GoalGenerationJob> {
    return unwrap(
      apiClient.post<ApiResponse<GoalGenerationJob>>(
        `/goals/${id}/generate-roadmap`,
        {},
        config(signal),
      ),
    );
  },
};
