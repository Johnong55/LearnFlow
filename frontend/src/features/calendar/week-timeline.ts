import { addDays, startOfDay } from "date-fns";

import type { DayOfWeek } from "@/features/onboarding/types";
import type { CalendarItem } from "@/lib/api/calendar.api";
import type { Routine } from "@/lib/api/routines.api";

const dayEnumByIndex: Record<number, DayOfWeek> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

export type TimelineBlock =
  | {
      kind: "ROUTINE";
      key: string;
      startMinute: number;
      endMinute: number;
      continuation: boolean;
      routine: Routine;
    }
  | {
      kind: "CALENDAR_ITEM";
      key: string;
      startMinute: number;
      endMinute: number;
      continuation: boolean;
      item: CalendarItem;
    };

function clockMinutes(value: string): number {
  const [hour = 0, minute = 0] = value.split(":").map(Number);
  return hour * 60 + minute;
}

export function buildTimelineBlocks(
  day: Date,
  routines: Routine[],
  items: CalendarItem[],
): TimelineBlock[] {
  const dayStart = startOfDay(day);
  const nextDayStart = addDays(dayStart, 1);
  const currentDay = dayEnumByIndex[day.getDay()]!;
  const previousDay = dayEnumByIndex[addDays(day, -1).getDay()]!;
  const blocks: TimelineBlock[] = [];

  for (const routine of routines) {
    const startMinute = clockMinutes(routine.startTime);
    const endMinute = clockMinutes(routine.endTime);
    const overnight = endMinute <= startMinute;

    if (routine.weekdays.includes(currentDay)) {
      blocks.push({
        kind: "ROUTINE",
        key: `routine-${routine.id}-start`,
        startMinute,
        endMinute: overnight ? 24 * 60 : endMinute,
        continuation: false,
        routine,
      });
    }
    if (overnight && endMinute > 0 && routine.weekdays.includes(previousDay)) {
      blocks.push({
        kind: "ROUTINE",
        key: `routine-${routine.id}-continuation`,
        startMinute: 0,
        endMinute,
        continuation: true,
        routine,
      });
    }
  }

  for (const item of items) {
    const startAt = new Date(item.startAt);
    const endAt = new Date(item.endAt);
    if (startAt >= nextDayStart || endAt <= dayStart) continue;
    const startMinute = Math.max(
      0,
      Math.round((startAt.getTime() - dayStart.getTime()) / 60_000),
    );
    const endMinute = Math.min(
      24 * 60,
      Math.round((endAt.getTime() - dayStart.getTime()) / 60_000),
    );
    blocks.push({
      kind: "CALENDAR_ITEM",
      key: `${item.kind.toLowerCase()}-${item.id}`,
      startMinute,
      endMinute,
      continuation: startAt < dayStart,
      item,
    });
  }

  return blocks.sort(
    (left, right) =>
      left.startMinute - right.startMinute ||
      right.endMinute -
        right.startMinute -
        (left.endMinute - left.startMinute) ||
      left.key.localeCompare(right.key),
  );
}
