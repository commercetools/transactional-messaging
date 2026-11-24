const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/** https anywhere, plus plain http on this machine so the service can run beside the Merchant Center dev server. */
export const isAllowedServiceUrl = (url: URL): boolean =>
  url.protocol === 'https:' ||
  (url.protocol === 'http:' && LOCAL_HOSTS.has(url.hostname));
