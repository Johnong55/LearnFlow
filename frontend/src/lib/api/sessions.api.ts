import type { AxiosRequestConfig } from "axios";

import type { ReschedulingMode } from "@/features/onboarding/types";
import type { StudySession } from "@/lib/api/calendar.api";
import { apiClient, unwrap } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";

const config = (signal?: AbortSignal): AxiosRequestConfig =>
  signal ? { signal } : {};

export const sessionsApi = {
  start: (id: string, signal?: AbortSignal): Promise<StudySession> =>
    unwrap(
      apiClient.post<ApiResponse<StudySession>>(
        `/sessions/${id}/start`,
        {},
        config(signal),
      ),
    ),
  pause: (id: string, signal?: AbortSignal): Promise<StudySession> =>
    unwrap(
      apiClient.post<ApiResponse<StudySession>>(
        `/sessions/${id}/pause`,
        {},
        config(signal),
      ),
    ),
  complete: (
    id: string,
    input: {
      actualMinutes?: number;
      difficultyRating?: number;
      focusLevel?: number;
      notes?: string;
      tookLongerThanExpected?: boolean;
    },
    signal?: AbortSignal,
  ): Promise<StudySession> =>
    unwrap(
      apiClient.post<ApiResponse<StudySession>>(
        `/sessions/${id}/complete`,
        input,
        config(signal),
      ),
    ),
  skip: (
    id: string,
    input: { reason?: string; reschedulingMode?: ReschedulingMode },
    signal?: AbortSignal,
  ): Promise<{ session: StudySession; rescheduleJob: { jobId: string } }> =>
    unwrap(
      apiClient.post<
        ApiResponse<{ session: StudySession; rescheduleJob: { jobId: string } }>
      >(`/sessions/${id}/skip`, input, config(signal)),
    ),
};
