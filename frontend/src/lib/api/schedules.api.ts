import type { AxiosRequestConfig } from "axios";

import type { ReschedulingMode } from "@/features/onboarding/types";
import { apiClient, unwrap } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";

export type ScheduleRequest = {
  roadmapId: string;
  from?: string;
  to?: string;
  mode?: ReschedulingMode;
  minimumSessionMinutes?: number;
  breakMinutes?: number;
};

export type SchedulePlan = {
  roadmapId: string;
  roadmapVersion: number;
  sessions: Array<{
    taskId: string;
    taskTitle: string;
    startAt: string;
    endAt: string;
    plannedMinutes: number;
  }>;
  unscheduledTasks: Array<{
    taskId: string;
    taskTitle: string;
    remainingMinutes: number;
    code: string;
    reason: string;
  }>;
  summary: {
    scheduledTasks: number;
    scheduledSessions: number;
    scheduledMinutes: number;
    unscheduledTasks: number;
  };
  impact?: {
    action: "CREATE" | "REBALANCE";
    existingSessions: number;
  };
};

export type ScheduleJob = {
  jobId: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
  progress: number;
  message: string | null;
  error: { code: string; message: string | null } | null;
  result: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

const config = (
  signal?: AbortSignal,
  timeout?: number,
): AxiosRequestConfig => ({
  ...(signal ? { signal } : {}),
  ...(timeout ? { timeout } : {}),
});

export const schedulesApi = {
  preview: (
    input: ScheduleRequest,
    signal?: AbortSignal,
  ): Promise<SchedulePlan> =>
    unwrap(
      apiClient.post<ApiResponse<SchedulePlan>>(
        "/schedules/preview",
        input,
        config(signal, 60_000),
      ),
    ),
  generate: (
    input: ScheduleRequest,
    signal?: AbortSignal,
  ): Promise<ScheduleJob> =>
    unwrap(
      apiClient.post<ApiResponse<ScheduleJob>>(
        "/schedules/generate",
        input,
        config(signal, 20_000),
      ),
    ),
  rebalance: (
    input: ScheduleRequest,
    signal?: AbortSignal,
  ): Promise<ScheduleJob> =>
    unwrap(
      apiClient.post<ApiResponse<ScheduleJob>>(
        "/schedules/rebalance",
        input,
        config(signal, 20_000),
      ),
    ),
  job: (id: string, signal?: AbortSignal): Promise<ScheduleJob> =>
    unwrap(
      apiClient.get<ApiResponse<ScheduleJob>>(
        `/schedules/jobs/${id}`,
        config(signal),
      ),
    ),
};
