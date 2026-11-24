import { ClientBuilder } from '@commercetools/ts-client';
import { readConfiguration } from '../config';

/**
 * Builds the commercetools client. Budget: the event ack window is about 10 s, so each request
 * times out at 2.5 s and retries at most once.
 */
export const createClient = () => {
  const { projectKey, clientId, clientSecret, scope, apiUrl, authUrl } =
    readConfiguration();
  return new ClientBuilder()
    .withProjectKey(projectKey)
    .withClientCredentialsFlow({
      host: authUrl,
      projectKey,
      credentials: { clientId, clientSecret },
      scopes: scope ? scope.split(/\s+/) : undefined,
    })
    .withHttpMiddleware({
      host: apiUrl,
      timeout: 2500,
      enableRetry: true,
      retryConfig: { maxRetries: 1 },
    })
    .build();
};
