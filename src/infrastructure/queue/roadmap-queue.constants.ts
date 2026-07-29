export const ROADMAP_QUEUE = 'roadmap-generation';
export const ROADMAP_SEARCH_JOB = 'roadmap-search';
export const ROADMAP_SOURCE_PROCESSING_JOB = 'roadmap-source-processing';
export const ROADMAP_PERSONALIZATION_JOB = 'roadmap-personalization';
export const ROADMAP_VALIDATION_JOB = 'roadmap-validation';

export const roadmapStageProgress: Record<string, { progress: number; message: string }> = {
  [ROADMAP_SEARCH_JOB]: { progress: 15, message: 'Searching learning resources...' },
  [ROADMAP_SOURCE_PROCESSING_JOB]: { progress: 40, message: 'Analyzing roadmap sources...' },
  [ROADMAP_PERSONALIZATION_JOB]: { progress: 65, message: 'Creating your personalized roadmap...' },
  [ROADMAP_VALIDATION_JOB]: { progress: 90, message: 'Validating and saving your roadmap...' },
};
