import { StudySessionStatus } from '@prisma/client';
import { canTransition } from '../domain/session-state.machine';

describe('study session state machine', () => {
  it('supports start, pause, resume, and complete transitions', () => {
    expect(canTransition(StudySessionStatus.SCHEDULED, 'START')).toBe(true);
    expect(canTransition(StudySessionStatus.IN_PROGRESS, 'PAUSE')).toBe(true);
    expect(canTransition(StudySessionStatus.PAUSED, 'START')).toBe(true);
    expect(canTransition(StudySessionStatus.PAUSED, 'COMPLETE')).toBe(true);
  });

  it('rejects transitions from terminal states', () => {
    for (const status of [
      StudySessionStatus.COMPLETED,
      StudySessionStatus.SKIPPED,
      StudySessionStatus.MISSED,
      StudySessionStatus.CANCELLED,
    ]) {
      expect(canTransition(status, 'START')).toBe(false);
      expect(canTransition(status, 'PAUSE')).toBe(false);
      expect(canTransition(status, 'COMPLETE')).toBe(false);
      expect(canTransition(status, 'SKIP')).toBe(false);
    }
  });
});
