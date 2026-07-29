import type { DayOfWeek } from '@/generated/prisma/client';

const MINUTES_PER_DAY = 1440;
const MINUTES_PER_WEEK = MINUTES_PER_DAY * 7;
const dayIndexes: Record<DayOfWeek, number> = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
};

export interface RecurringTimeInput {
  weekdays: DayOfWeek[];
  startTime: string;
  endTime: string;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
}

interface MinuteRange {
  start: number;
  end: number;
}

export function timeToMinutes(value: string): number {
  const [hours = '0', minutes = '0'] = value.split(':');
  return Number(hours) * 60 + Number(minutes);
}

export function durationMinutes(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  return end > start ? end - start : end + MINUTES_PER_DAY - start;
}

export function recurringTimesOverlap(
  first: RecurringTimeInput,
  second: RecurringTimeInput,
): boolean {
  const firstRanges = expandWeekly(first);
  const secondRanges = expandWeekly(second);
  return firstRanges.some((left) =>
    secondRanges.some((right) => left.start < right.end && right.start < left.end),
  );
}

function expandWeekly(input: RecurringTimeInput): MinuteRange[] {
  const duration = durationMinutes(input.startTime, input.endTime);
  const startMinute = timeToMinutes(input.startTime);
  const before = input.bufferBeforeMinutes ?? 0;
  const after = input.bufferAfterMinutes ?? 0;
  const ranges: MinuteRange[] = [];

  for (const weekday of input.weekdays) {
    const absoluteStart = dayIndexes[weekday] * MINUTES_PER_DAY + startMinute - before;
    const absoluteEnd = absoluteStart + before + duration + after;
    for (const shift of [-MINUTES_PER_WEEK, 0, MINUTES_PER_WEEK]) {
      const start = Math.max(0, absoluteStart + shift);
      const end = Math.min(MINUTES_PER_WEEK, absoluteEnd + shift);
      if (start < end) ranges.push({ start, end });
    }
  }
  return ranges;
}
