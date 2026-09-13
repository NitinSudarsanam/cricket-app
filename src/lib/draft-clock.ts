export const DEFAULT_PICK_TIMEOUT_SECONDS = 60;

export function secondsRemainingOnClock(
  turnStartedAt: Date | string | null | undefined,
  pickTimeoutSeconds: number,
  now: Date = new Date()
): number {
  if (!turnStartedAt || pickTimeoutSeconds <= 0) return pickTimeoutSeconds;
  const started = turnStartedAt instanceof Date ? turnStartedAt : new Date(turnStartedAt);
  if (Number.isNaN(started.getTime())) return pickTimeoutSeconds;
  const elapsed = Math.floor((now.getTime() - started.getTime()) / 1000);
  return Math.max(0, pickTimeoutSeconds - elapsed);
}

export function isTurnExpired(
  turnStartedAt: Date | string | null | undefined,
  pickTimeoutSeconds: number,
  now: Date = new Date()
): boolean {
  if (!turnStartedAt || pickTimeoutSeconds <= 0) return false;
  return secondsRemainingOnClock(turnStartedAt, pickTimeoutSeconds, now) <= 0;
}
