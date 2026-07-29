import type { SearchResult } from '@/infrastructure/external/search/search-provider.interface';

export interface RoadmapJobData {
  backgroundJobId: string;
  runId: string;
  userId: string;
  goalId: string;
  queries?: string[];
  searchResults?: SearchResult[];
  roadmapDraft?: unknown;
}

export interface GenerationContext {
  goal: {
    id: string;
    title: string;
    description: string;
    currentLevel: string;
    targetLevel: string;
    targetDate: Date;
    weeklyAvailableHours: number;
    skillName: string;
  };
  profile: { timezone: string; locale: string };
  preference: {
    preferredLearningFormat?: string;
    preferredSessionMinutes: number;
    preferredStudyDays: string[];
  };
}
