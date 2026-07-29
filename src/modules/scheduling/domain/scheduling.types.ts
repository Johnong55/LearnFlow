import type {
  AvailabilityType,
  ConstraintPriority,
  DayOfWeek,
  ReschedulingMode,
  RoadmapDifficulty,
  RoutineType,
} from '@/generated/prisma/client';

export interface TimeSlot {
  startAt: Date;
  endAt: Date;
}

export interface RecurringConstraint {
  id: string;
  weekdays: DayOfWeek[];
  startTime: string;
  endTime: string;
  priority: ConstraintPriority;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  type?: RoutineType | AvailabilityType;
  effectiveFrom?: Date | null;
  effectiveUntil?: Date | null;
}

export interface SchedulingTask {
  id: string;
  title: string;
  estimatedMinutes: number;
  difficulty: RoadmapDifficulty;
  priority: number;
  order: number;
  milestoneOrder: number;
  moduleOrder: number;
  dependencyIds: string[];
}

export interface SchedulingInput {
  from: string;
  to: string;
  timeZone: string;
  tasks: SchedulingTask[];
  routines: RecurringConstraint[];
  availabilityRules: RecurringConstraint[];
  blockedSlots: TimeSlot[];
  existingDailyMinutes: Record<string, number>;
  preferredSessionMinutes: number;
  minimumSessionMinutes: number;
  maxDailyLearningMinutes: number;
  breakMinutes: number;
  preferredStudyTime?: string | null;
  preferredStudyDays: DayOfWeek[];
  mode: ReschedulingMode;
}

export interface ProposedSession extends TimeSlot {
  taskId: string;
  taskTitle: string;
  plannedMinutes: number;
}

export interface UnscheduledTask {
  taskId: string;
  taskTitle: string;
  remainingMinutes: number;
  code: 'TASK_TOO_SHORT' | 'NO_VALID_SLOT' | 'DEPENDENCY_UNSCHEDULED';
  reason: string;
}

export interface SchedulePlan {
  sessions: ProposedSession[];
  unscheduledTasks: UnscheduledTask[];
  summary: {
    scheduledTasks: number;
    scheduledSessions: number;
    scheduledMinutes: number;
    unscheduledTasks: number;
  };
}
