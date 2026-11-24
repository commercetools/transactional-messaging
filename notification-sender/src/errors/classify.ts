export type FailureKind = 'transient' | 'permanent';

const statusOf = (err: unknown): number | undefined => {
  const e = err as { statusCode?: unknown; status?: unknown; body?: { statusCode?: unknown } };
  for (const candidate of [e?.statusCode, e?.body?.statusCode, e?.status]) {
    if (typeof candidate === 'number') return candidate;
  }
  return undefined;
};

/**
 * Transient failures are retried by the broker (503 to the platform).
 * Permanent failures are acknowledged so the same message is never redelivered forever.
 * No HTTP status at all means a network error or timeout, which is transient.
 */
export const classifyError = (err: unknown): FailureKind => {
  const status = statusOf(err);
  if (status === undefined) return 'transient';
  if (status === 429 || status >= 500) return 'transient';
  return 'permanent';
};
