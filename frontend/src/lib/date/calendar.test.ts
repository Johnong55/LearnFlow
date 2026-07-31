import { dayOfWeek, minutesBetween } from "@/lib/date/calendar";

describe("calendar date utilities", () => {
  it("maps JavaScript dates to backend weekday enums", () => {
    expect(dayOfWeek(new Date(2026, 6, 27))).toBe("MONDAY");
    expect(dayOfWeek(new Date(2026, 7, 2))).toBe("SUNDAY");
  });

  it("calculates session length from UTC values", () => {
    expect(
      minutesBetween("2026-07-30T01:00:00.000Z", "2026-07-30T01:45:00.000Z"),
    ).toBe(45);
  });
});
