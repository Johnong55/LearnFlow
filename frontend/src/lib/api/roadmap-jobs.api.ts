import type { AxiosRequestConfig } from "axios";

import { apiClient, unwrap } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";

export type RoadmapJobStatus =
  "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

export type RoadmapJob = {
  jobId: string;
  status: RoadmapJobStatus;
  progress: number;
  message: string | null;
  error: { code: string; message: string | null } | null;
  result: {
    version: number;
    roadmapId: string;
    versionId: string;
    scheduleJobId: string | null;
    scheduleWarning: string | null;
  } | null;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
};

const config = (signal?: AbortSignal): AxiosRequestConfig =>
  signal ? { signal } : {};

export const roadmapJobsApi = {
  start(goalId: string, signal?: AbortSignal): Promise<RoadmapJob> {
    return unwrap(
      apiClient.post<ApiResponse<RoadmapJob>>(
        `/goals/${goalId}/generate-roadmap`,
        {},
        config(signal),
      ),
    );
  },
  get(jobId: string, signal?: AbortSignal): Promise<RoadmapJob> {
    return unwrap(
      apiClient.get<ApiResponse<RoadmapJob>>(
        `/roadmap-jobs/${jobId}`,
        config(signal),
      ),
    );
  },
  retry(jobId: string, signal?: AbortSignal): Promise<RoadmapJob> {
    return unwrap(
      apiClient.post<ApiResponse<RoadmapJob>>(
        `/roadmap-jobs/${jobId}/retry`,
        {},
        config(signal),
      ),
    );
  },
};
