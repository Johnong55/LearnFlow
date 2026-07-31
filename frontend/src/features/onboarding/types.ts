export const WEEKDAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export type DayOfWeek = (typeof WEEKDAYS)[number];
export type WorkMode = "REMOTE" | "HYBRID" | "OFFICE";
export type SkillLevel =
  "NONE" | "BEGINNER" | "ELEMENTARY" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
export type LearningFormat =
  "VIDEO" | "TEXT" | "INTERACTIVE" | "PROJECT" | "MENTOR" | "MIXED";
export type GoalPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ReschedulingMode = "BALANCED" | "DEADLINE_FOCUSED" | "LOW_STRESS";
export type RoutineType =
  | "BREAKFAST"
  | "LUNCH"
  | "DINNER"
  | "EXERCISE"
  | "COMMUTE"
  | "FAMILY"
  | "HOUSEWORK"
  | "ENTERTAINMENT"
  | "HYGIENE"
  | "REST"
  | "PERSONAL"
  | "OTHER";

export type RoutineDraft = {
  clientId: string;
  type: RoutineType;
  title: string;
  weekdays: DayOfWeek[];
  startTime: string;
  endTime: string;
  isFlexible: boolean;
  constraintPriority: "HARD" | "SOFT";
  priority: number;
  minimumDurationMinutes: number;
  preferredDurationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  notes: string;
};

export type DesiredSkillDraft = {
  clientId: string;
  name: string;
  currentLevel: SkillLevel;
  targetLevel: SkillLevel;
};

export type OnboardingDraft = {
  personal: {
    fullName: string;
    occupation: string;
    jobTitle: string;
    timezone: string;
    locale: string;
    scheduleKind: "OFFICE" | "REMOTE" | "HYBRID" | "STUDENT" | "FLEXIBLE";
  };
  work: {
    workingDays: DayOfWeek[];
    startTime: string;
    endTime: string;
    workMode: WorkMode;
    commuteMinutes: number;
    flexibleHours: boolean;
  };
  sleep: {
    wakeUpTime: string;
    sleepTime: string;
    weekendDifferent: boolean;
    weekendWakeUpTime: string;
    weekendSleepTime: string;
    flexible: boolean;
  };
  routines: RoutineDraft[];
  energy: {
    focusWindow:
      "EARLY_MORNING" | "MORNING" | "AFTERNOON" | "EVENING" | "VARIES";
    morning: "LOW" | "MEDIUM" | "HIGH";
    afternoon: "LOW" | "MEDIUM" | "HIGH";
    evening: "LOW" | "MEDIUM" | "HIGH";
  };
  skills: DesiredSkillDraft[];
  goal: {
    title: string;
    description: string;
    targetDate: string;
    weeklyAvailableHours: number;
    priority: GoalPriority;
    successCriteria: string[];
  };
  preferences: {
    preferredSessionMinutes: number;
    maximumStudyMinutesPerDay: number;
    preferredStudyDays: DayOfWeek[];
    preferredLearningFormat: LearningFormat;
    maximumCognitiveWorkload: number;
    reschedulingMode: ReschedulingMode;
  };
};

export type OnboardingStatus = {
  completed: boolean;
  currentStep: number;
  completedSteps: string[];
  missingSteps: string[];
  completedAt: string | null;
};

export type OnboardingServerDraft = {
  userId: string;
  currentStep: number;
  personalProfile: Record<string, unknown> | null;
  workSchedule: Record<string, unknown> | null;
  lifeRoutine: Record<string, unknown> | null;
  learningPreferences: Record<string, unknown> | null;
  completedAt: string | null;
};

export const SKILL_LEVELS: Array<{ value: SkillLevel; label: string }> = [
  { value: "NONE", label: "Chưa bắt đầu" },
  { value: "BEGINNER", label: "Mới bắt đầu" },
  { value: "ELEMENTARY", label: "Cơ bản" },
  { value: "INTERMEDIATE", label: "Trung cấp" },
  { value: "ADVANCED", label: "Nâng cao" },
  { value: "EXPERT", label: "Chuyên gia" },
];

export const WEEKDAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "T2",
  TUESDAY: "T3",
  WEDNESDAY: "T4",
  THURSDAY: "T5",
  FRIDAY: "T6",
  SATURDAY: "T7",
  SUNDAY: "CN",
};
