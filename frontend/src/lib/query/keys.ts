export const queryKeys = {
  user: {
    current: ["user", "current"] as const,
  },
  onboarding: {
    status: ["onboarding", "status"] as const,
    detail: ["onboarding", "detail"] as const,
  },
  roadmaps: {
    all: ["roadmaps"] as const,
    detail: (id: string) => ["roadmaps", id] as const,
    sources: (id: string) => ["roadmaps", id, "sources"] as const,
    job: (id: string) => ["roadmap-jobs", id] as const,
  },
  goals: {
    all: ["goals"] as const,
    detail: (id: string) => ["goals", id] as const,
  },
  progress: {
    overview: ["progress", "overview"] as const,
    weekly: ["progress", "weekly"] as const,
    goal: (id: string) => ["progress", "goal", id] as const,
  },
  notifications: {
    all: ["notifications"] as const,
  },
  routines: {
    all: ["routines"] as const,
  },
  calendar: {
    day: (date: string) => ["calendar", "day", date] as const,
    week: (date: string) => ["calendar", "week", date] as const,
    range: (from: string, to: string) =>
      ["calendar", "range", from, to] as const,
  },
  schedules: {
    job: (id: string) => ["schedules", "job", id] as const,
    conflicts: ["schedules", "conflicts"] as const,
  },
} as const;
