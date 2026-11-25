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

declare const window: Window &
  typeof globalThis & { app?: { templateApiDevUrl?: string } };

/**
 * Local development only: when TEMPLATE_API_DEV_URL is set in .env, the app calls the service at that
 * localhost address directly instead of through the Merchant Center proxy. Ignored in a production build.
 */
export const devServiceUrl = (): string | undefined => {
  if (process.env.NODE_ENV === 'production' || typeof window === 'undefined')
    return undefined;
  const url = urlOf({ url: window.app?.templateApiDevUrl });
  if (!url?.startsWith('http://')) return undefined;
  // The service answers under its Connect endpoint path, so a bare host:port gets it added.
  const parsed = new URL(url);
  return parsed.pathname === '/'
    ? `${parsed.origin}/templateApi`
    : url.replace(/\/+$/, '');
};
