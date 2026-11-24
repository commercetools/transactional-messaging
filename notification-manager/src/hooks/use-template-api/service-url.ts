/** https, or plain http on this machine so a service running locally can be used during development. */
export const urlOf = (value: unknown): string | undefined => {
  const url = (value as { url?: unknown } | null | undefined)?.url;
  if (typeof url !== 'string') return undefined;
  try {
    const parsed = new URL(url);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
    return parsed.protocol === 'https:' ||
      (parsed.protocol === 'http:' && local)
      ? url
      : undefined;
  } catch {
    return undefined;
  }
};
