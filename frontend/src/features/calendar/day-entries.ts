import type { CalendarItem } from "@/lib/api/calendar.api";
import type { Routine } from "@/lib/api/routines.api";

export type DayEntry =
  | {
      kind: "ROUTINE";
      key: string;
      startMinute: number;
      endMinute: number;
      routine: Routine;
    }
  | {
      kind: "CALENDAR_ITEM";
      key: string;
      startMinute: number;
      endMinute: number;
      item: CalendarItem;
    };

export function clockMinutes(value: string): number {
  const [hour = 0, minute = 0] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function localMinutes(value: string): number {
  const date = new Date(value);
  return date.getHours() * 60 + date.getMinutes();
}

export function buildDayEntries(
  routines: Routine[],
  items: CalendarItem[],
): DayEntry[] {
  const entries: DayEntry[] = [
    ...routines.map((routine): DayEntry => {
      const startMinute = clockMinutes(routine.startTime);
      const rawEndMinute = clockMinutes(routine.endTime);
      return {
        kind: "ROUTINE",
        key: `routine-${routine.id}`,
        startMinute,
        endMinute:
          rawEndMinute <= startMinute ? rawEndMinute + 24 * 60 : rawEndMinute,
        routine,
      };
    }),
    ...items.map((item): DayEntry => {
      const startMinute = localMinutes(item.startAt);
      const durationMinutes = Math.max(
        0,
        Math.round(
          (new Date(item.endAt).getTime() - new Date(item.startAt).getTime()) /
            60_000,
        ),
      );
      return {
        kind: "CALENDAR_ITEM",
        key: `${item.kind.toLowerCase()}-${item.id}`,
        startMinute,
        endMinute: startMinute + durationMinutes,
        item,
      };
    }),
  ];

  return entries.sort(
    (left, right) =>
      left.startMinute - right.startMinute ||
      left.endMinute - right.endMinute ||
      left.kind.localeCompare(right.kind) ||
      left.key.localeCompare(right.key),
  );
}
