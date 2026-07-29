import type { DayOfWeek } from '@prisma/client';

const weekdayMap: Record<string, DayOfWeek> = {
  Mon: 'MONDAY',
  Tue: 'TUESDAY',
  Wed: 'WEDNESDAY',
  Thu: 'THURSDAY',
  Fri: 'FRIDAY',
  Sat: 'SATURDAY',
  Sun: 'SUNDAY',
};

function parts(date: Date, timeZone: string): Record<string, string> {
  const values = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  }).formatToParts(date);
  return Object.fromEntries(values.map((part) => [part.type, part.value]));
}

export function localDateKey(date: Date, timeZone: string): string {
  const value = parts(date, timeZone);
  return `${value.year}-${value.month}-${value.day}`;
}

export function weekdayForDate(dateKey: string): DayOfWeek {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
  }).format(new Date(`${dateKey}T12:00:00.000Z`));
  return weekdayMap[weekday]!;
}

export function addLocalDays(dateKey: string, days: number): string {
  const [year = 0, month = 1, day = 1] = dateKey.split('-').map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return result.toISOString().slice(0, 10);
}

export function zonedDateTimeToUtc(dateKey: string, time: string, timeZone: string): Date {
  const [year = 0, month = 1, day = 1] = dateKey.split('-').map(Number);
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let guess = target;
  for (let iteration = 0; iteration < 2; iteration += 1) {
    const value = parts(new Date(guess), timeZone);
    const represented = Date.UTC(
      Number(value.year),
      Number(value.month) - 1,
      Number(value.day),
      Number(value.hour),
      Number(value.minute),
      Number(value.second),
    );
    guess += target - represented;
  }
  return new Date(guess);
}

export function eachLocalDate(from: string, to: string): string[] {
  const dates: string[] = [];
  for (let date = from; date <= to; date = addLocalDays(date, 1)) dates.push(date);
  return dates;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}
