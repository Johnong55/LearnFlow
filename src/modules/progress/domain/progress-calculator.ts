import { LearningTaskStatus, StudySessionStatus } from '@prisma/client';
import { addLocalDays, localDateKey } from '@/common/utils/timezone.utils';

const DAY_MS = 86_400_000;

export interface ProgressSessionInput {
  taskId: string;
  startAt: Date;
  endAt: Date;
  plannedMinutes: number;
  actualMinutes: number | null;
  status: StudySessionStatus;
  completedAt: Date | null;
}

export interface ProgressTaskInput {
  id: string;
  milestoneId: string;
  status: LearningTaskStatus;
  estimatedMinutes: number;
}

export interface ProgressCalculationInput {
  tasks: ProgressTaskInput[];
  sessions: ProgressSessionInput[];
  milestoneIds: string[];
  targetDate: Date;
  weeklyAvailableHours: number;
  preferredStudyDays: number;
  timeZone: string;
  now: Date;
}

export interface ProgressMetrics {
  plannedLearningMinutes: number;
  actualLearningMinutes: number;
  taskCompletionRate: number;
  milestoneCompletionRate: number;
  scheduleAdherenceRate: number;
  currentStreak: number;
  weeklyConsistency: number;
  estimatedCompletionDate: Date;
  scheduleVarianceDays: number;
  pace: 'AHEAD' | 'ON_TRACK' | 'DELAYED';
  completedTasks: number;
  totalTasks: number;
  completedMilestones: number;
  totalMilestones: number;
  weekly: Array<{
    date: string;
    plannedMinutes: number;
    actualMinutes: number;
    completedSessions: number;
  }>;
}

export function calculateProgress(input: ProgressCalculationInput): ProgressMetrics {
  const completedSessions = input.sessions.filter(
    (session) => session.status === StudySessionStatus.COMPLETED,
  );
  const plannedLearningMinutes = input.sessions
    .filter((session) => session.status !== StudySessionStatus.CANCELLED)
    .reduce((sum, session) => sum + session.plannedMinutes, 0);
  const actualLearningMinutes = completedSessions.reduce(
    (sum, session) => sum + (session.actualMinutes ?? 0),
    0,
  );
  const completedTasks = input.tasks.filter(
    (task) => task.status === LearningTaskStatus.COMPLETED,
  ).length;
  const completedMilestones = input.milestoneIds.filter((milestoneId) => {
    const tasks = input.tasks.filter((task) => task.milestoneId === milestoneId);
    return tasks.length > 0 && tasks.every((task) => task.status === LearningTaskStatus.COMPLETED);
  }).length;
  const adherenceDenominator = input.sessions.filter(
    (session) =>
      session.status === StudySessionStatus.COMPLETED ||
      session.status === StudySessionStatus.SKIPPED ||
      session.status === StudySessionStatus.MISSED ||
      (session.status === StudySessionStatus.SCHEDULED && session.endAt <= input.now),
  ).length;
  const completedDates = new Set(
    completedSessions.map((session) =>
      localDateKey(session.completedAt ?? session.endAt, input.timeZone),
    ),
  );
  const today = localDateKey(input.now, input.timeZone);
  const streakStart = completedDates.has(today) ? today : addLocalDays(today, -1);
  let currentStreak = 0;
  for (let date = streakStart; completedDates.has(date); date = addLocalDays(date, -1))
    currentStreak += 1;

  const weeklyDates = Array.from({ length: 7 }, (_, index) => addLocalDays(today, index - 6));
  const weekly = weeklyDates.map((date) => {
    const sessions = input.sessions.filter(
      (session) => localDateKey(session.startAt, input.timeZone) === date,
    );
    return {
      date,
      plannedMinutes: sessions
        .filter((session) => session.status !== StudySessionStatus.CANCELLED)
        .reduce((sum, session) => sum + session.plannedMinutes, 0),
      actualMinutes: sessions
        .filter((session) => session.status === StudySessionStatus.COMPLETED)
        .reduce((sum, session) => sum + (session.actualMinutes ?? 0), 0),
      completedSessions: sessions.filter(
        (session) => session.status === StudySessionStatus.COMPLETED,
      ).length,
    };
  });
  const consistentDays = weekly.filter((day) => day.completedSessions > 0).length;
  const expectedDays = Math.max(1, input.preferredStudyDays || 7);

  const actualByTask = new Map<string, number>();
  for (const session of completedSessions)
    actualByTask.set(
      session.taskId,
      (actualByTask.get(session.taskId) ?? 0) + (session.actualMinutes ?? 0),
    );
  const remainingMinutes = input.tasks.reduce(
    (sum, task) =>
      sum +
      (task.status === LearningTaskStatus.COMPLETED
        ? 0
        : Math.max(0, task.estimatedMinutes - (actualByTask.get(task.id) ?? 0))),
    0,
  );
  const weeklyCapacityMinutes = Math.max(60, input.weeklyAvailableHours * 60);
  const estimatedWeeks = remainingMinutes / weeklyCapacityMinutes;
  const estimatedCompletionDate = new Date(input.now.getTime() + estimatedWeeks * 7 * DAY_MS);
  const scheduleVarianceDays = Math.ceil(
    (estimatedCompletionDate.getTime() - input.targetDate.getTime()) / DAY_MS,
  );

  return {
    plannedLearningMinutes,
    actualLearningMinutes,
    taskCompletionRate: percentage(completedTasks, input.tasks.length),
    milestoneCompletionRate: percentage(completedMilestones, input.milestoneIds.length),
    scheduleAdherenceRate: percentage(completedSessions.length, adherenceDenominator),
    currentStreak,
    weeklyConsistency: Math.min(100, percentage(consistentDays, expectedDays)),
    estimatedCompletionDate,
    scheduleVarianceDays,
    pace: scheduleVarianceDays > 2 ? 'DELAYED' : scheduleVarianceDays < -2 ? 'AHEAD' : 'ON_TRACK',
    completedTasks,
    totalTasks: input.tasks.length,
    completedMilestones,
    totalMilestones: input.milestoneIds.length,
    weekly,
  };
}

function percentage(numerator: number, denominator: number): number {
  return denominator ? Math.round((numerator / denominator) * 10_000) / 100 : 0;
}
