import type { AxiosRequestConfig } from "axios";

import { apiClient, unwrap } from "@/lib/api/client";
import type { ApiResponse, CurrentUser } from "@/types/api";

export type UpdateUserInput = {
  fullName?: string;
  timezone?: string;
  locale?: string;
  occupation?: string;
  jobTitle?: string;
  preferredLearningStyle?: string;
  preferredSessionMinutes?: number;
  preferredStudyTime?: string;
  preferredStudyDays?: string[];
  preferredLearningFormat?: string;
  maxDailyLearningMinutes?: number;
  maxCognitiveLoad?: number;
  notifications?: Record<string, boolean>;
};

export const usersApi = {
  updateMe(input: UpdateUserInput, signal?: AbortSignal): Promise<CurrentUser> {
    const config: AxiosRequestConfig = signal ? { signal } : {};
    return unwrap(
      apiClient.patch<ApiResponse<CurrentUser>>("/users/me", input, config),
    );
  },
};
