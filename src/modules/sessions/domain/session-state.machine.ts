import { StudySessionStatus } from '@/generated/prisma/client';

export type SessionAction = 'START' | 'PAUSE' | 'COMPLETE' | 'SKIP';

const allowed: Record<SessionAction, StudySessionStatus[]> = {
  START: [StudySessionStatus.SCHEDULED, StudySessionStatus.PAUSED],
  PAUSE: [StudySessionStatus.IN_PROGRESS],
  COMPLETE: [StudySessionStatus.IN_PROGRESS, StudySessionStatus.PAUSED],
  SKIP: [StudySessionStatus.SCHEDULED, StudySessionStatus.IN_PROGRESS, StudySessionStatus.PAUSED],
};

export function canTransition(status: StudySessionStatus, action: SessionAction): boolean {
  return allowed[action].includes(status);
}

export function transitionError(status: StudySessionStatus, action: SessionAction): string {
  return `Cannot ${action.toLowerCase()} a session with status ${status}.`;
}
