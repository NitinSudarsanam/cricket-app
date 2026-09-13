export const DEFAULT_PICK_TIMEOUT_SECONDS = 60;

function asDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Old in-progress drafts may have a null turnStartedAt. Fall back to draft
 * start, then "now", so the clock can still expire.
 */
export function resolveTurnStartedAt(
  turnStartedAt: Date | string | null | undefined,
  startedAt?: Date | string | null,
  now: Date = new Date()
): Date {
  return asDate(turnStartedAt) ?? asDate(startedAt) ?? now;
}

export function secondsRemainingOnClock(
  turnStartedAt: Date | string | null | undefined,
  pickTimeoutSeconds: number,
  now: Date = new Date(),
  startedAt?: Date | string | null
): number {
  if (pickTimeoutSeconds <= 0) return 0;
  const started = resolveTurnStartedAt(turnStartedAt, startedAt, now);
  const elapsed = Math.floor((now.getTime() - started.getTime()) / 1000);
  return Math.max(0, pickTimeoutSeconds - elapsed);
}

export function isTurnExpired(
  turnStartedAt: Date | string | null | undefined,
  pickTimeoutSeconds: number,
  now: Date = new Date(),
  startedAt?: Date | string | null
): boolean {
  if (pickTimeoutSeconds <= 0) return false;
  return secondsRemainingOnClock(turnStartedAt, pickTimeoutSeconds, now, startedAt) <= 0;
}

export function isUniqueConstraintError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: string }).code;
  if (code === 'P2002') return true;
  const message = error instanceof Error ? error.message : '';
  return message.includes('P2002');
}
