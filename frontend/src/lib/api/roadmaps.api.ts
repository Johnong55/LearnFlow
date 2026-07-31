import type { AxiosRequestConfig } from "axios";

import type { SkillLevel } from "@/features/onboarding/types";
import { apiClient, unwrap } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";
import type { RoadmapJob } from "@/lib/api/roadmap-jobs.api";

export type RoadmapTask = {
  id: string;
  title: string;
  description: string;
  type: "LEARNING" | "PRACTICE" | "PROJECT" | "ASSESSMENT" | "REVIEW";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
  order: number;
  estimatedMinutes: number;
  difficulty: SkillLevel;
  dependencies: Array<{ prerequisiteId: string }>;
};

export type RoadmapModule = {
  id: string;
  title: string;
  description: string;
  order: number;
  estimatedHours: number;
  tasks: RoadmapTask[];
  sourceReferences: Array<{
    source: { id: string; title: string; url: string; sourceDomain: string };
  }>;
};

export type RoadmapMilestone = {
  id: string;
  title: string;
  description: string;
  order: number;
  estimatedHours: number;
  modules: RoadmapModule[];
};

export type RoadmapVersion = {
  id: string;
  version: number;
  status: string;
  summary: string;
  estimatedWeeks: number;
  weeklyHours: number;
  difficulty: string;
  assumptions: string[];
  prerequisites: string[];
  milestones: RoadmapMilestone[];
};

export type Roadmap = {
  id: string;
  goalId: string;
  title: string;
  status: string;
  currentVersionNumber: number | null;
  activeVersionNumber: number | null;
  createdAt: string;
  updatedAt: string;
  goal: {
    id: string;
    title: string;
    status: string;
    skill: { id: string; name: string };
  };
  versions: RoadmapVersion[];
};

export type RoadmapSource = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  sourceDomain: string;
  publishedAt: string | null;
  retrievedAt: string;
  contentType: string;
  relevanceScore: number | string;
  credibilityScore: number | string;
  language: string;
};

const config = (signal?: AbortSignal): AxiosRequestConfig =>
  signal ? { signal } : {};

export const roadmapsApi = {
  list: (signal?: AbortSignal): Promise<Roadmap[]> =>
    unwrap(apiClient.get<ApiResponse<Roadmap[]>>("/roadmaps", config(signal))),
  detail: (id: string, signal?: AbortSignal): Promise<Roadmap> =>
    unwrap(
      apiClient.get<ApiResponse<Roadmap>>(`/roadmaps/${id}`, config(signal)),
    ),
  sources: (id: string, signal?: AbortSignal): Promise<RoadmapSource[]> =>
    unwrap(
      apiClient.get<ApiResponse<RoadmapSource[]>>(
        `/roadmaps/${id}/sources`,
        config(signal),
      ),
    ),
  activate: (id: string, signal?: AbortSignal): Promise<Roadmap> =>
    unwrap(
      apiClient.post<ApiResponse<Roadmap>>(
        `/roadmaps/${id}/activate`,
        {},
        config(signal),
      ),
    ),
  regenerate: (id: string, signal?: AbortSignal): Promise<RoadmapJob> =>
    unwrap(
      apiClient.post<ApiResponse<RoadmapJob>>(
        `/roadmaps/${id}/regenerate`,
        {},
        config(signal),
      ),
    ),
};
