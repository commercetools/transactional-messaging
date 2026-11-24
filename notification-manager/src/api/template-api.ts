import {
  buildApiUrl,
  createHttpClientOptions,
  executeHttpClientRequest,
} from '@commercetools-frontend/application-shell';

export type TemplateChannel = 'email' | 'sms';

export type TemplateSummary = {
  id: string;
  name: string;
  channel: TemplateChannel;
  updatedAt: string;
};

export type TemplateDetail = TemplateSummary & {
  subject: string;
  html: string;
  text: string;
};

export type TemplateInput = {
  channel: TemplateChannel;
  name: string;
  subject: string;
  html: string;
  text: string;
};

/** Carries the HTTP status so the UI can tell a missing template from a failed call. */
export class TemplateApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'TemplateApiError';
    this.status = status;
  }
}

export type TemplateApi = {
  list(channel?: TemplateChannel): Promise<TemplateSummary[]>;
  get(id: string): Promise<TemplateDetail>;
  create(input: TemplateInput): Promise<TemplateDetail>;
  update(id: string, input: TemplateInput): Promise<TemplateDetail>;
  remove(id: string): Promise<void>;
};

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

const messageOf = (body: unknown, status: number): string =>
  typeof body === 'object' &&
  body !== null &&
  typeof (body as { message?: unknown }).message === 'string'
    ? (body as { message: string }).message
    : `The template service answered with HTTP ${status}.`;

/**
 * Calls the template service through the Merchant Center proxy (`/proxy/forward-to`). The proxy adds a
 * short-lived token that the service verifies, so no credentials are kept in the browser.
 * `serviceUrl` is the Connect endpoint URL stored by the connector's post-deploy script.
 */
export const createTemplateApi = (serviceUrl: string): TemplateApi => {
  const base = serviceUrl.replace(/\/+$/, '');

  const call = <T>(method: Method, path: string, body?: unknown): Promise<T> =>
    executeHttpClientRequest<T>(
      async (options: ReturnType<typeof createHttpClientOptions>) => {
        const response = await fetch(buildApiUrl('/proxy/forward-to'), {
          method,
          credentials: options.credentials,
          headers: {
            ...options.headers,
            ...(body === undefined
              ? {}
              : { 'Content-Type': 'application/json' }),
          },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
        const parsed: unknown =
          response.status === 204
            ? undefined
            : await response.json().catch(() => undefined);
        if (!response.ok) {
          throw new TemplateApiError(
            response.status,
            messageOf(parsed, response.status)
          );
        }
        return {
          data: parsed as T,
          statusCode: response.status,
          getHeader: (name: string) => response.headers.get(name),
        };
      },
      {
        forwardToConfig: {
          uri: `${base}${path}`,
          includeUserPermissions: true,
          version: 'v2',
        },
      }
    );

  return {
    list: async (channel) => {
      const query = channel ? `?channel=${channel}` : '';
      const { results } = await call<{ results: TemplateSummary[] }>(
        'GET',
        `/templates${query}`
      );
      return results;
    },
    get: (id) => call('GET', `/templates/${encodeURIComponent(id)}`),
    create: (input) => call('POST', '/templates', input),
    update: (id, input) =>
      call('PUT', `/templates/${encodeURIComponent(id)}`, input),
    remove: (id) => call('DELETE', `/templates/${encodeURIComponent(id)}`),
  };
};
