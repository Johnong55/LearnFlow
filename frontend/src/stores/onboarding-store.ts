import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  DesiredSkillDraft,
  OnboardingDraft,
  RoutineDraft,
} from "@/features/onboarding/types";

const initialDraft: OnboardingDraft = {
  personal: {
    fullName: "",
    occupation: "",
    jobTitle: "",
    timezone: "Asia/Ho_Chi_Minh",
    locale: "vi-VN",
    scheduleKind: "OFFICE",
  },
  work: {
    workingDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    startTime: "08:30",
    endTime: "17:30",
    workMode: "OFFICE",
    commuteMinutes: 30,
    flexibleHours: false,
  },
  sleep: {
    wakeUpTime: "06:30",
    sleepTime: "23:00",
    weekendDifferent: false,
    weekendWakeUpTime: "07:30",
    weekendSleepTime: "23:30",
    flexible: false,
  },
  routines: [],
  energy: {
    focusWindow: "MORNING",
    morning: "HIGH",
    afternoon: "MEDIUM",
    evening: "LOW",
  },
  skills: [],
  goal: {
    title: "",
    description: "",
    targetDate: "",
    weeklyAvailableHours: 8,
    priority: "MEDIUM",
    successCriteria: [""],
  },
  preferences: {
    preferredSessionMinutes: 45,
    maximumStudyMinutesPerDay: 120,
    preferredStudyDays: ["TUESDAY", "THURSDAY", "SATURDAY"],
    preferredLearningFormat: "MIXED",
    maximumCognitiveWorkload: 7,
    reschedulingMode: "BALANCED",
  },
};

type DraftSection = keyof OnboardingDraft;

type OnboardingState = {
  draft: OnboardingDraft;
  lastSavedAt: string | null;
  completedGoalId: string | null;
  updateSection: <K extends DraftSection>(
    section: K,
    value: Partial<OnboardingDraft[K]>,
  ) => void;
  setRoutines: (routines: RoutineDraft[]) => void;
  addRoutine: (routine: RoutineDraft) => void;
  updateRoutine: (clientId: string, routine: Partial<RoutineDraft>) => void;
  removeRoutine: (clientId: string) => void;
  setSkills: (skills: DesiredSkillDraft[]) => void;
  markSaved: () => void;
  setCompletedGoalId: (goalId: string) => void;
  reset: () => void;
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      draft: initialDraft,
      lastSavedAt: null,
      completedGoalId: null,
      updateSection: (section, value) =>
        set((state) => ({
          draft: {
            ...state.draft,
            [section]: { ...state.draft[section], ...value },
          },
        })),
      setRoutines: (routines) =>
        set((state) => ({ draft: { ...state.draft, routines } })),
      addRoutine: (routine) =>
        set((state) => ({
          draft: {
            ...state.draft,
            routines: [...state.draft.routines, routine],
          },
        })),
      updateRoutine: (clientId, routine) =>
        set((state) => ({
          draft: {
            ...state.draft,
            routines: state.draft.routines.map((item) =>
              item.clientId === clientId ? { ...item, ...routine } : item,
            ),
          },
        })),
      removeRoutine: (clientId) =>
        set((state) => ({
          draft: {
            ...state.draft,
            routines: state.draft.routines.filter(
              (item) => item.clientId !== clientId,
            ),
          },
        })),
      setSkills: (skills) =>
        set((state) => ({ draft: { ...state.draft, skills } })),
      markSaved: () => set({ lastSavedAt: new Date().toISOString() }),
      setCompletedGoalId: (completedGoalId) => set({ completedGoalId }),
      reset: () =>
        set({ draft: initialDraft, lastSavedAt: null, completedGoalId: null }),
    }),
    {
      name: "skillpilot-onboarding-draft",
      version: 1,
      partialize: ({ draft, lastSavedAt, completedGoalId }) => ({
        draft,
        lastSavedAt,
        completedGoalId,
      }),
    },
  ),
);
