import { DayOfWeek } from '@prisma/client';
import { durationMinutes, recurringTimesOverlap } from './time.utils';

describe('recurring time utilities', () => {
  it('calculates overnight duration', () => {
    expect(durationMinutes('23:00', '07:00')).toBe(480);
  });

  it('detects an overlap carried into the next weekday', () => {
    expect(
      recurringTimesOverlap(
        { weekdays: [DayOfWeek.MONDAY], startTime: '23:00', endTime: '07:00' },
        { weekdays: [DayOfWeek.TUESDAY], startTime: '06:30', endTime: '08:00' },
      ),
    ).toBe(true);
  });

  it('allows adjacent fixed slots', () => {
    expect(
      recurringTimesOverlap(
        { weekdays: [DayOfWeek.MONDAY], startTime: '08:00', endTime: '09:00' },
        { weekdays: [DayOfWeek.MONDAY], startTime: '09:00', endTime: '10:00' },
      ),
    ).toBe(false);
  });
});
