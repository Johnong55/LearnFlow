import type { AxiosRequestConfig } from "axios";

import type {
  DayOfWeek,
  RoutineDraft,
  RoutineType,
} from "@/features/onboarding/types";
import { apiClient, unwrap } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";

export type Routine = Omit<RoutineDraft, "clientId" | "notes" | "type"> & {
  id: string;
  userId: string;
  type: RoutineType | "SLEEP" | "WORK";
  weekdays: DayOfWeek[];
  source: string;
  createdAt: string;
  updatedAt: string;
};

export type SaveRoutineInput = Omit<RoutineDraft, "clientId" | "notes">;
export type RoutineInput = SaveRoutineInput;

const config = (signal?: AbortSignal): AxiosRequestConfig =>
  signal ? { signal } : {};

export const routinesApi = {
  list: (signal?: AbortSignal): Promise<Routine[]> =>
    unwrap(apiClient.get<ApiResponse<Routine[]>>("/routines", config(signal))),
  create: (input: SaveRoutineInput, signal?: AbortSignal): Promise<Routine> =>
    unwrap(
      apiClient.post<ApiResponse<Routine>>("/routines", input, config(signal)),
    ),
  update: (
    id: string,
    input: Partial<SaveRoutineInput>,
    signal?: AbortSignal,
  ): Promise<Routine> =>
    unwrap(
      apiClient.patch<ApiResponse<Routine>>(
        `/routines/${id}`,
        input,
        config(signal),
      ),
    ),
  delete: (id: string, signal?: AbortSignal): Promise<{ message: string }> =>
    unwrap(
      apiClient.delete<ApiResponse<{ message: string }>>(
        `/routines/${id}`,
        config(signal),
      ),
    ),
};
