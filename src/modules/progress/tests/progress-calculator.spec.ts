import { LearningTaskStatus, StudySessionStatus } from '@prisma/client';
import { calculateProgress } from '../domain/progress-calculator';

describe('calculateProgress', () => {
  it('calculates completion, adherence, streak, and pace deterministically', () => {
    const now = new Date('2026-08-05T12:00:00.000Z');
    const result = calculateProgress({
      now,
      timeZone: 'UTC',
      targetDate: new Date('2026-09-30T00:00:00.000Z'),
      weeklyAvailableHours: 5,
      preferredStudyDays: 5,
      milestoneIds: ['milestone'],
      tasks: [
        {
          id: 'completed',
          milestoneId: 'milestone',
          status: LearningTaskStatus.COMPLETED,
          estimatedMinutes: 60,
        },
        {
          id: 'pending',
          milestoneId: 'milestone',
          status: LearningTaskStatus.PENDING,
          estimatedMinutes: 120,
        },
      ],
      sessions: [
        {
          taskId: 'completed',
          startAt: new Date('2026-08-04T09:00:00.000Z'),
          endAt: new Date('2026-08-04T10:00:00.000Z'),
          completedAt: new Date('2026-08-04T10:00:00.000Z'),
          plannedMinutes: 60,
          actualMinutes: 70,
          status: StudySessionStatus.COMPLETED,
        },
        {
          taskId: 'pending',
          startAt: new Date('2026-08-05T09:00:00.000Z'),
          endAt: new Date('2026-08-05T10:00:00.000Z'),
          completedAt: null,
          plannedMinutes: 60,
          actualMinutes: null,
          status: StudySessionStatus.SKIPPED,
        },
      ],
    });

    expect(result.actualLearningMinutes).toBe(70);
    expect(result.taskCompletionRate).toBe(50);
    expect(result.milestoneCompletionRate).toBe(0);
    expect(result.scheduleAdherenceRate).toBe(50);
    expect(result.currentStreak).toBe(1);
    expect(result.pace).toBe('AHEAD');
  });
});
