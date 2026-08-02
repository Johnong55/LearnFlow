import type { AxiosRequestConfig } from "axios";

import { apiClient, unwrap } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";

export type StudySessionStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "PAUSED"
  | "COMPLETED"
  | "SKIPPED"
  | "MISSED"
  | "CANCELLED";

export type CalendarEvent = {
  kind: "CALENDAR_EVENT";
  id: string;
  title: string;
  description: string | null;
  type:
    | "APPOINTMENT"
    | "WORK"
    | "PERSONAL"
    | "MEDICAL"
    | "FAMILY"
    | "TRAVEL"
    | "OTHER";
  startAt: string;
  endAt: string;
  isFixed: boolean;
  isAllDay: boolean;
  location: string | null;
};

export type CalendarEventItem = CalendarEvent;
export type CalendarEventType = CalendarEvent["type"];

export type StudySession = {
  kind: "STUDY_SESSION";
  id: string;
  taskId: string;
  startAt: string;
  endAt: string;
  plannedMinutes: number;
  actualMinutes: number | null;
  startedAt: string | null;
  lastResumedAt: string | null;
  pausedAt: string | null;
  completedAt: string | null;
  accumulatedSeconds: number;
  status: StudySessionStatus;
  source: "GENERATED" | "REBALANCED" | "MANUAL";
  task: {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    estimatedMinutes: number;
    module?: {
      id?: string;
      title?: string;
      milestone: {
        id?: string;
        title?: string;
        version: { roadmapId: string };
      };
    };
  };
};

export type StudySessionItem = StudySession;

export type CalendarItem = CalendarEvent | StudySession;
export type CalendarRange = { from: string; to: string; items: CalendarItem[] };

export type CreateCalendarEventInput = {
  title: string;
  description?: string;
  type: CalendarEvent["type"];
  startAt: string;
  endAt: string;
  isFixed: boolean;
  isAllDay: boolean;
  location?: string;
};

const config = (signal?: AbortSignal): AxiosRequestConfig =>
  signal ? { signal } : {};

export const calendarApi = {
  range: (
    from: string,
    to: string,
    signal?: AbortSignal,
  ): Promise<CalendarRange> =>
    unwrap(
      apiClient.get<ApiResponse<CalendarRange>>("/calendar", {
        ...config(signal),
        params: { from, to },
      }),
    ),
  day: (date: string, signal?: AbortSignal): Promise<CalendarRange> =>
    unwrap(
      apiClient.get<ApiResponse<CalendarRange>>("/calendar/day", {
        ...config(signal),
        params: { date },
      }),
    ),
  week: (date: string, signal?: AbortSignal): Promise<CalendarRange> =>
    unwrap(
      apiClient.get<ApiResponse<CalendarRange>>("/calendar/week", {
        ...config(signal),
        params: { date },
      }),
    ),
  createEvent: (
    input: CreateCalendarEventInput,
    signal?: AbortSignal,
  ): Promise<CalendarEvent> =>
    unwrap(
      apiClient.post<ApiResponse<CalendarEvent>>(
        "/calendar/events",
        input,
        config(signal),
      ),
    ),
  updateEvent: (
    id: string,
    input: Partial<CreateCalendarEventInput>,
    signal?: AbortSignal,
  ): Promise<CalendarEvent> =>
    unwrap(
      apiClient.patch<ApiResponse<CalendarEvent>>(
        `/calendar/events/${id}`,
        input,
        config(signal),
      ),
    ),
  deleteEvent: (
    id: string,
    signal?: AbortSignal,
  ): Promise<{ message: string }> =>
    unwrap(
      apiClient.delete<ApiResponse<{ message: string }>>(
        `/calendar/events/${id}`,
        config(signal),
      ),
    ),
  create: (
    input: CreateCalendarEventInput,
    signal?: AbortSignal,
  ): Promise<CalendarEvent> =>
    unwrap(
      apiClient.post<ApiResponse<CalendarEvent>>(
        "/calendar/events",
        input,
        config(signal),
      ),
    ),
  update: (
    id: string,
    input: Partial<CreateCalendarEventInput>,
    signal?: AbortSignal,
  ): Promise<CalendarEvent> =>
    unwrap(
      apiClient.patch<ApiResponse<CalendarEvent>>(
        `/calendar/events/${id}`,
        input,
        config(signal),
      ),
    ),
  delete: (id: string, signal?: AbortSignal): Promise<{ message: string }> =>
    unwrap(
      apiClient.delete<ApiResponse<{ message: string }>>(
        `/calendar/events/${id}`,
        config(signal),
      ),
    ),
};
