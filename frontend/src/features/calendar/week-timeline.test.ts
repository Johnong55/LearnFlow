import { describe, expect, it } from "vitest";

import { buildTimelineBlocks } from "@/features/calendar/week-timeline";
import type { CalendarItem } from "@/lib/api/calendar.api";
import type { Routine } from "@/lib/api/routines.api";

const routine = (
  id: string,
  type: Routine["type"],
  startTime: string,
  endTime: string,
  weekdays: Routine["weekdays"],
) => ({ id, type, title: id, startTime, endTime, weekdays }) as Routine;

describe("week timeline blocks", () => {
  it("uses minute-based positions for long and nested activities", () => {
    const day = new Date(2026, 7, 3);
    const blocks = buildTimelineBlocks(
      day,
      [
        routine("Work", "WORK", "08:30", "17:30", ["MONDAY"]),
        routine("Breakfast", "BREAKFAST", "08:45", "09:00", ["MONDAY"]),
      ],
      [],
    );
    expect(
      blocks.map(({ startMinute, endMinute }) => ({
        startMinute,
        endMinute,
      })),
    ).toEqual([
      { startMinute: 510, endMinute: 1050 },
      { startMinute: 525, endMinute: 540 },
    ]);
  });

  it("splits an overnight routine across adjacent days", () => {
    const sleep = routine("Sleep", "SLEEP", "23:00", "07:00", [
      "SUNDAY",
      "MONDAY",
    ]);
    const monday = buildTimelineBlocks(new Date(2026, 7, 3), [sleep], []);
    expect(
      monday.map(({ startMinute, endMinute, continuation }) => ({
        startMinute,
        endMinute,
        continuation,
      })),
    ).toEqual([
      { startMinute: 0, endMinute: 420, continuation: true },
      { startMinute: 1380, endMinute: 1440, continuation: false },
    ]);
  });

  it("clips calendar items to the visible day", () => {
    const item = {
      kind: "CALENDAR_EVENT",
      id: "overnight",
      startAt: "2026-08-02T23:30:00",
      endAt: "2026-08-03T01:15:00",
    } as CalendarItem;
    const [block] = buildTimelineBlocks(new Date(2026, 7, 3), [], [item]);
    expect(block).toMatchObject({
      startMinute: 0,
      endMinute: 75,
      continuation: true,
    });
  });
});
