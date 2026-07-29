import {
  ConstraintPriority,
  ReschedulingMode,
  RoadmapDifficulty,
  RoutineType,
} from '@/generated/prisma/client';
import { SchedulingEngine } from '../domain/scheduling.engine';
import type { SchedulingInput, SchedulingTask } from '../domain/scheduling.types';

describe('SchedulingEngine', () => {
  const engine = new SchedulingEngine();
  const date = '2026-08-03';

  function task(id: string, overrides: Partial<SchedulingTask> = {}): SchedulingTask {
    return {
      id,
      title: `Task ${id}`,
      estimatedMinutes: 60,
      difficulty: RoadmapDifficulty.BEGINNER,
      priority: 3,
      order: 1,
      milestoneOrder: 1,
      moduleOrder: 1,
      dependencyIds: [],
      ...overrides,
    };
  }

  function input(overrides: Partial<SchedulingInput> = {}): SchedulingInput {
    return {
      from: date,
      to: date,
      timeZone: 'UTC',
      tasks: [task('one')],
      routines: [],
      availabilityRules: [],
      blockedSlots: [],
      existingDailyMinutes: {},
      preferredSessionMinutes: 60,
      minimumSessionMinutes: 30,
      maxDailyLearningMinutes: 120,
      breakMinutes: 10,
      preferredStudyDays: [],
      mode: ReschedulingMode.BALANCED,
      ...overrides,
    };
  }

  it('never schedules study during hard work hours', () => {
    const plan = engine.generate(
      input({
        routines: [
          {
            id: 'work',
            weekdays: ['MONDAY'],
            startTime: '06:00',
            endTime: '20:00',
            priority: ConstraintPriority.HARD,
            type: RoutineType.WORK,
          },
        ],
      }),
    );
    expect(plan.sessions).toHaveLength(1);
    expect(plan.sessions[0]!.startAt.toISOString()).toBe('2026-08-03T20:00:00.000Z');
  });

  it('never schedules study during sleep hours', () => {
    const plan = engine.generate(
      input({
        routines: [
          {
            id: 'sleep',
            weekdays: ['MONDAY'],
            startTime: '06:00',
            endTime: '09:00',
            priority: ConstraintPriority.HARD,
            type: RoutineType.SLEEP,
          },
        ],
      }),
    );
    expect(plan.sessions[0]!.startAt.toISOString()).toBe('2026-08-03T09:00:00.000Z');
  });

  it('does not exceed the hard maximum daily learning time', () => {
    const plan = engine.generate(
      input({ tasks: [task('one'), task('two', { order: 2 })], maxDailyLearningMinutes: 60 }),
    );
    expect(plan.summary.scheduledMinutes).toBe(60);
    expect(plan.unscheduledTasks).toHaveLength(1);
  });

  it('does not overlap fixed calendar events', () => {
    const plan = engine.generate(
      input({
        blockedSlots: [
          {
            startAt: new Date('2026-08-03T06:00:00.000Z'),
            endAt: new Date('2026-08-03T18:00:00.000Z'),
          },
        ],
      }),
    );
    expect(plan.sessions[0]!.startAt.toISOString()).toBe('2026-08-03T18:00:00.000Z');
  });

  it('schedules prerequisites before dependent tasks', () => {
    const plan = engine.generate(
      input({
        tasks: [
          task('dependent', { priority: 5, dependencyIds: ['prerequisite'] }),
          task('prerequisite', { order: 2 }),
        ],
      }),
    );
    const prerequisite = plan.sessions.find((session) => session.taskId === 'prerequisite')!;
    const dependent = plan.sessions.find((session) => session.taskId === 'dependent')!;
    expect(prerequisite.endAt.getTime()).toBeLessThanOrEqual(dependent.startAt.getTime());
  });
});
