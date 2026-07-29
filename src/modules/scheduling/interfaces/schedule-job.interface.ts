import type { ReschedulingMode, StudySessionSource } from '@/generated/prisma/client';

export interface ScheduleJobData {
  backgroundJobId: string;
  userId: string;
  roadmapId: string;
  from: string;
  to: string;
  mode: ReschedulingMode;
  minimumSessionMinutes: number;
  breakMinutes: number;
  source: StudySessionSource;
}
