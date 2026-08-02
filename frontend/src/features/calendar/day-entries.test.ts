import { describe, expect, it } from "vitest";

import { buildDayEntries, clockMinutes } from "@/features/calendar/day-entries";
import type { CalendarItem } from "@/lib/api/calendar.api";
import type { Routine } from "@/lib/api/routines.api";

const routine = (
  id: string,
  title: string,
  startTime: string,
  endTime: string,
) =>
  ({
    id,
    title,
    startTime,
    endTime,
    weekdays: ["SUNDAY"],
  }) as Routine;

const studySession = (id: string, title: string, start: string, end: string) =>
  ({
    kind: "STUDY_SESSION",
    id,
    startAt: start,
    endAt: end,
    task: { title },
  }) as CalendarItem;

describe("calendar day entries", () => {
  it("sorts routines and sessions together by their displayed start time", () => {
    const entries = buildDayEntries(
      [
        routine("sleep", "Sleep", "23:00", "07:00"),
        routine("work", "Work", "08:30", "17:30"),
        routine("breakfast", "Bữa sáng", "08:45", "09:00"),
      ],
      [
        studySession(
          "study",
          "Bài học",
          "2026-08-02T06:00:00",
          "2026-08-02T06:40:00",
        ),
      ],
    );

    expect(
      entries.map((entry) =>
        entry.kind === "ROUTINE"
          ? entry.routine.title
          : entry.item.kind === "STUDY_SESSION"
            ? entry.item.task.title
            : entry.item.title,
      ),
    ).toEqual(["Bài học", "Work", "Bữa sáng", "Sleep"]);
  });

  it("sorts equal start times by their end time", () => {
    const entries = buildDayEntries(
      [
        routine("dinner", "Bữa tối", "19:00", "20:00"),
        routine("shower", "Tắm", "19:00", "19:15"),
      ],
      [],
    );
    expect(
      entries.map((entry) =>
        entry.kind === "ROUTINE" ? entry.routine.title : "",
      ),
    ).toEqual(["Tắm", "Bữa tối"]);
  });

  it("treats an overnight end time as the following day", () => {
    const [sleep] = buildDayEntries(
      [routine("sleep", "Sleep", "23:00", "07:00")],
      [],
    );
    expect(clockMinutes("23:00")).toBe(1380);
    expect(sleep?.endMinute).toBe(1860);
  });
});
