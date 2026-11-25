import CustomError from './errors/custom.error';
import { isAllowedServiceUrl } from './utils/service-origin';

export type Configuration = {
  projectKey: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
  apiUrl: string;
  authUrl: string;
};

export type ServiceConfiguration = {
  sendGridApiKey: string;
  dataResidency: 'global' | 'eu';
  cloudIdentifier: string;
  entryPointUriPath: string;
  /** Origin the Merchant Center signs into the token as its audience. */
  audience: string;
  /**
   * Local development only: skips the Merchant Center token check and answers browser calls directly.
   * Never allowed in a deployed service (see readServiceConfiguration).
   */
  devMode: boolean;
};

const value = (env: NodeJS.ProcessEnv, name: string): string | undefined => {
  const raw = env[name]?.trim();
  return raw ? raw : undefined;
};

const fail = (message: string, problems: string[]): never => {
  throw new CustomError(
    'InvalidEnvironmentVariablesError',
    message,
    problems.map((problem) => ({
      code: 'InvalidEnvironmentVariable',
      message: problem,
    }))
  );
};

const originOf = (url: string): string | undefined => {
  try {
    const parsed = new URL(url);
    return isAllowedServiceUrl(parsed) ? parsed.origin : undefined;
  } catch {
    return undefined;
  }
};

/**
 * commercetools API configuration, injected by Connect from inheritAs.apiClient.
 * Messages name the variable and never its value.
 */
export const readConfiguration = (
  env: NodeJS.ProcessEnv = process.env
): Configuration => {
  const problems: string[] = [];
  const need = (name: string): string => {
    const found = value(env, name);
    if (!found) problems.push(`${name} is required`);
    return found ?? '';
  };
  const configuration: Configuration = {
    projectKey: need('CTP_PROJECT_KEY'),
    clientId: need('CTP_CLIENT_ID'),
    clientSecret: need('CTP_CLIENT_SECRET'),
    scope: value(env, 'CTP_SCOPE'),
    apiUrl: need('CTP_API_URL'),
    authUrl: need('CTP_AUTH_URL'),
  };
  if (problems.length > 0) {
    fail(
      'Invalid environment variables, please check your configuration.',
      problems
    );
  }
  return configuration;
};

/** Configuration of the HTTP service itself (SendGrid access and Merchant Center token checks). */
export const readServiceConfiguration = (
  env: NodeJS.ProcessEnv = process.env
): ServiceConfiguration => {
  const problems: string[] = [];

  const sendGridApiKey = value(env, 'SENDGRID_API_KEY');
  if (!sendGridApiKey) problems.push('SENDGRID_API_KEY is required');
  else if (!sendGridApiKey.startsWith('SG.')) {
    problems.push('SENDGRID_API_KEY must start with SG.');
  }

  const residency = value(env, 'SENDGRID_DATA_RESIDENCY') ?? 'global';
  if (residency !== 'global' && residency !== 'eu') {
    problems.push('SENDGRID_DATA_RESIDENCY must be global or eu');
  }

  const cloudIdentifier = value(env, 'CLOUD_IDENTIFIER');
  if (!cloudIdentifier) problems.push('CLOUD_IDENTIFIER is required');

  const entryPointUriPath = value(env, 'ENTRY_POINT_URI_PATH');
  if (!entryPointUriPath) problems.push('ENTRY_POINT_URI_PATH is required');

  const devMode = value(env, 'TEMPLATE_API_DEV_MODE') === 'true';
  if (
    devMode &&
    (env.NODE_ENV === 'production' || value(env, 'CONNECT_SERVICE_URL'))
  ) {
    problems.push(
      'TEMPLATE_API_DEV_MODE must not be set in a deployed service, because it turns off authentication'
    );
  }

  const publicUrl =
    value(env, 'TEMPLATE_API_PUBLIC_URL') ?? value(env, 'CONNECT_SERVICE_URL');
  const audience = publicUrl ? originOf(publicUrl) : undefined;
  // Dev mode has no token to verify, so it needs no audience.
  if (!audience && !devMode) {
    problems.push(
      'CONNECT_SERVICE_URL (or TEMPLATE_API_PUBLIC_URL) must be an https URL, or http://localhost for local development'
    );
  }

  if (problems.length > 0) {
    fail(
      'Invalid service configuration, please check your configuration.',
      problems
    );
  }
  return {
    sendGridApiKey: sendGridApiKey as string,
    dataResidency: residency === 'eu' ? 'eu' : 'global',
    cloudIdentifier: cloudIdentifier as string,
    entryPointUriPath: entryPointUriPath as string,
    audience: audience ?? '',
    devMode,
  };
};

/** Same derivation as entryPointUriPathToPermissionKeys from the application shell. */
export const permissionNames = (entryPointUriPath: string) => {
  const resource = entryPointUriPath
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return { view: `canView${resource}`, manage: `canManage${resource}` };
};
