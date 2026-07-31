import { format } from "date-fns";

import type { DayOfWeek } from "@/features/onboarding/types";

const weekdays: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

export function localDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function dateTimeLocalValue(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export function timeLabel(value: string | Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(typeof value === "string" ? new Date(value) : value);
}

export const formatTime = timeLabel;

export function dayOfWeek(date: Date): DayOfWeek {
  return weekdays[date.getDay()]!;
}

export function minutesBetween(startAt: string, endAt: string): number {
  return Math.max(
    0,
    Math.round(
      (new Date(endAt).getTime() - new Date(startAt).getTime()) / 60_000,
    ),
  );
}
