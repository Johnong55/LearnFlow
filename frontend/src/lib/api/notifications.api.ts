import type { AxiosRequestConfig } from "axios";

import { apiClient, unwrap } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";

export type NotificationStatus = "PENDING" | "SENT" | "FAILED" | "READ";

export type AppNotification = {
  id: string;
  type: "SCHEDULE_CHANGED" | "DEADLINE_RISK" | "PROGRESS_SUMMARY" | "SYSTEM";
  status: NotificationStatus;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};

const config = (signal?: AbortSignal): AxiosRequestConfig =>
  signal ? { signal } : {};

export const notificationsApi = {
  list: (signal?: AbortSignal): Promise<AppNotification[]> =>
    unwrap(
      apiClient.get<ApiResponse<AppNotification[]>>(
        "/notifications",
        config(signal),
      ),
    ),
  markRead: (id: string, signal?: AbortSignal): Promise<AppNotification> =>
    unwrap(
      apiClient.post<ApiResponse<AppNotification>>(
        `/notifications/${id}/read`,
        {},
        config(signal),
      ),
    ),
};
