import { describe, expect, it } from "vitest";

import {
  breakTimerSnapshot,
  focusTimerSnapshot,
  formatFocusDuration,
  sessionElapsedSeconds,
} from "@/features/sessions/focus-timer";

describe("focus timer", () => {
  it("combines accumulated and current running time", () => {
    expect(
      sessionElapsedSeconds(
        {
          status: "IN_PROGRESS",
          accumulatedSeconds: 120,
          lastResumedAt: "2026-08-02T03:00:00.000Z",
        },
        new Date("2026-08-02T03:03:30.000Z").getTime(),
        0,
      ),
    ).toBe(330);
  });

  it("does not add wall time while paused", () => {
    expect(
      sessionElapsedSeconds(
        { status: "PAUSED", accumulatedSeconds: 540 },
        Date.now(),
        0,
      ),
    ).toBe(540);
  });

  it("reports remaining time and overtime deterministically", () => {
    expect(focusTimerSnapshot(900, 30)).toMatchObject({
      remainingSeconds: 900,
      overtimeSeconds: 0,
      progress: 0.5,
      actualMinutes: 15,
    });
    expect(focusTimerSnapshot(2100, 30)).toMatchObject({
      remainingSeconds: 0,
      overtimeSeconds: 300,
      progress: 1,
      actualMinutes: 35,
    });
  });

  it("formats short and long durations", () => {
    expect(formatFocusDuration(65)).toBe("01:05");
    expect(formatFocusDuration(3661)).toBe("01:01:01");
  });

  it("counts a break down from its persisted pause time", () => {
    const pausedAt = new Date("2026-08-02T03:00:00.000Z").getTime();
    expect(
      breakTimerSnapshot(
        pausedAt,
        new Date("2026-08-02T03:02:00.000Z").getTime(),
        5,
      ),
    ).toEqual({ remainingSeconds: 180, progress: 0.4, completed: false });
    expect(
      breakTimerSnapshot(
        pausedAt,
        new Date("2026-08-02T03:06:00.000Z").getTime(),
        5,
      ).completed,
    ).toBe(true);
  });
});
