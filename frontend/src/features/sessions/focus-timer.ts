export type FocusTimerSession = {
  status: string;
  accumulatedSeconds?: number;
  lastResumedAt?: string | null;
};

export function sessionElapsedSeconds(
  session: FocusTimerSession,
  nowMs: number,
  localStartedAtMs: number,
): number {
  const accumulated = Math.max(0, session.accumulatedSeconds ?? 0);
  if (session.status !== "IN_PROGRESS") return accumulated;
  const resumedAt = session.lastResumedAt
    ? new Date(session.lastResumedAt).getTime()
    : localStartedAtMs;
  if (!Number.isFinite(resumedAt)) return accumulated;
  return accumulated + Math.max(0, Math.floor((nowMs - resumedAt) / 1000));
}

export function formatFocusDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export function focusTimerSnapshot(
  elapsedSeconds: number,
  plannedMinutes: number,
) {
  const plannedSeconds = Math.max(60, plannedMinutes * 60);
  const remainingSeconds = Math.max(0, plannedSeconds - elapsedSeconds);
  const overtimeSeconds = Math.max(0, elapsedSeconds - plannedSeconds);
  return {
    remainingSeconds,
    overtimeSeconds,
    progress: Math.min(1, elapsedSeconds / plannedSeconds),
    actualMinutes: Math.max(1, Math.ceil(elapsedSeconds / 60)),
  };
}

export function breakTimerSnapshot(
  pausedAtMs: number,
  nowMs: number,
  breakMinutes: number,
) {
  const totalSeconds = Math.max(60, breakMinutes * 60);
  const elapsedSeconds = Math.max(0, Math.floor((nowMs - pausedAtMs) / 1000));
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
  return {
    remainingSeconds,
    progress: Math.min(1, elapsedSeconds / totalSeconds),
    completed: remainingSeconds === 0,
  };
}
