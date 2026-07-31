import type { ProgressDay } from "@/lib/api/progress.api";

export function minutesLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder} phút`;
  return remainder ? `${hours}g ${remainder}p` : `${hours} giờ`;
}

export function aggregateProgressDays(groups: ProgressDay[][]): ProgressDay[] {
  const totals = new Map<string, ProgressDay>();
  for (const days of groups) {
    for (const day of days) {
      const current = totals.get(day.date);
      totals.set(day.date, {
        date: day.date,
        plannedMinutes: (current?.plannedMinutes ?? 0) + day.plannedMinutes,
        actualMinutes: (current?.actualMinutes ?? 0) + day.actualMinutes,
        completedSessions:
          (current?.completedSessions ?? 0) + day.completedSessions,
      });
    }
  }
  return [...totals.values()].sort((a, b) => a.date.localeCompare(b.date));
}
