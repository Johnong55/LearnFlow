import { describe, expect, it } from "vitest";

import {
  aggregateProgressDays,
  minutesLabel,
} from "@/features/progress/progress-utils";

describe("progress utilities", () => {
  it("aggregates multiple goals by date and keeps chronological order", () => {
    expect(
      aggregateProgressDays([
        [
          {
            date: "2026-08-01",
            plannedMinutes: 45,
            actualMinutes: 30,
            completedSessions: 1,
          },
        ],
        [
          {
            date: "2026-07-31",
            plannedMinutes: 30,
            actualMinutes: 30,
            completedSessions: 1,
          },
          {
            date: "2026-08-01",
            plannedMinutes: 60,
            actualMinutes: 45,
            completedSessions: 1,
          },
        ],
      ]),
    ).toEqual([
      {
        date: "2026-07-31",
        plannedMinutes: 30,
        actualMinutes: 30,
        completedSessions: 1,
      },
      {
        date: "2026-08-01",
        plannedMinutes: 105,
        actualMinutes: 75,
        completedSessions: 2,
      },
    ]);
  });

  it("formats minutes without hiding remaining minutes", () => {
    expect(minutesLabel(45)).toBe("45 phút");
    expect(minutesLabel(120)).toBe("2 giờ");
    expect(minutesLabel(135)).toBe("2g 15p");
  });
});
