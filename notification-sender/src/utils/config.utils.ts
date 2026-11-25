import CustomError from '../errors/custom.error';

export type Configuration = {
  projectKey: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
  apiUrl: string;
  authUrl: string;
};

export type ChannelConfiguration = {
  defaultLocale: string;
  email?: {
    apiKey: string;
    from: string;
    dataResidency: 'global' | 'eu';
  };
  sms?: {
    accountSid: string;
    apiKeySid: string;
    apiKeySecret: string;
    messagingServiceSid?: string;
    fromNumber?: string;
    /** Optional boolean Custom Field name; when set, SMS requires consent (plan §7.8). */
    consentCustomField?: string;
    /** SMS texts are SendGrid templates, so SMS needs a SendGrid key even without the email channel. */
    templates: { apiKey: string; dataResidency: 'global' | 'eu' };
  };
};

const requiredValue = (name: string, problems: string[]): string => {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    problems.push(`${name} is required`);
    return '';
  }
  return value.trim();
};

const httpsUrlProblem = (value: string): string | undefined => {
  try {
    return new URL(value).protocol === 'https:' ? undefined : 'must use https';
  } catch {
    return 'is not a valid URL';
  }
};

const httpsUrlValue = (name: string, problems: string[]): string => {
  const value = requiredValue(name, problems);
  const problem = value ? httpsUrlProblem(value) : undefined;
  if (problem) problems.push(`${name} ${problem}`);
  return value;
};

/**
 * Reads the commercetools API configuration. Connect injects these from inheritAs.apiClient.
 * Error messages name the variable but never its value.
 */
export const readConfiguration = (): Configuration => {
  const problems: string[] = [];
  const configuration: Configuration = {
    projectKey: requiredValue('CTP_PROJECT_KEY', problems),
    clientId: requiredValue('CTP_CLIENT_ID', problems),
    clientSecret: requiredValue('CTP_CLIENT_SECRET', problems),
    scope: process.env.CTP_SCOPE?.trim() || undefined,
    apiUrl: httpsUrlValue('CTP_API_URL', problems),
    authUrl: httpsUrlValue('CTP_AUTH_URL', problems),
  };
  if (problems.length > 0) {
    throw new CustomError(
      'InvalidEnvironmentVariablesError',
      'Invalid environment variables, please check your configuration.',
      problems.map((message) => ({ code: 'InvalidEnvironmentVariable', message }))
    );
  }
  return configuration;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENDGRID_KEY_PATTERN = /^SG\./;
const TWILIO_ACCOUNT_SID_PATTERN = /^AC[0-9a-fA-F]{32}$/;
const TWILIO_API_KEY_SID_PATTERN = /^SK[0-9a-fA-F]{32}$/;
const TWILIO_MESSAGING_SERVICE_SID_PATTERN = /^MG[0-9a-fA-F]{32}$/;
const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

const optionalEnv = (env: NodeJS.ProcessEnv, name: string): string | undefined => {
  const value = env[name]?.trim();
  return value ? value : undefined;
};

const checkFormat = (
  name: string,
  value: string | undefined,
  pattern: RegExp,
  description: string,
  problems: string[]
) => {
  if (value !== undefined && !pattern.test(value)) problems.push(`${name} ${description}`);
};

/**
 * Reads the email and SMS channel configuration (plan Phase 6 §6.5).
 * Each channel is optional, but at least one must be complete. Partially configured channels fail
 * at startup, naming the missing keys. Error messages never include values.
 */
export const readChannelConfiguration = (env: NodeJS.ProcessEnv = process.env): ChannelConfiguration => {
  const problems: string[] = [];

  const defaultLocale = optionalEnv(env, 'DEFAULT_LOCALE');
  if (!defaultLocale) problems.push('DEFAULT_LOCALE is required');

  // Email channel: SENDGRID_API_KEY and SENDER_EMAIL_ADDRESS, both or neither.
  const sendGridApiKey = optionalEnv(env, 'SENDGRID_API_KEY');
  const senderEmail = optionalEnv(env, 'SENDER_EMAIL_ADDRESS');
  const emailEnabled = sendGridApiKey !== undefined && senderEmail !== undefined;
  checkFormat('SENDGRID_API_KEY', sendGridApiKey, SENDGRID_KEY_PATTERN, 'must start with SG.', problems);
  checkFormat('SENDER_EMAIL_ADDRESS', senderEmail, EMAIL_PATTERN, 'must be an email address', problems);

  const residencyValue = optionalEnv(env, 'SENDGRID_DATA_RESIDENCY') ?? 'global';
  const dataResidency: 'global' | 'eu' = residencyValue === 'eu' ? 'eu' : 'global';
  if (residencyValue !== 'global' && residencyValue !== 'eu') {
    problems.push('SENDGRID_DATA_RESIDENCY must be global or eu');
  }

  // SMS channel: the three credentials plus one sender (Messaging Service preferred).
  const smsKeys = {
    TWILIO_ACCOUNT_SID: optionalEnv(env, 'TWILIO_ACCOUNT_SID'),
    TWILIO_API_KEY_SID: optionalEnv(env, 'TWILIO_API_KEY_SID'),
    TWILIO_API_KEY_SECRET: optionalEnv(env, 'TWILIO_API_KEY_SECRET'),
  };
  const messagingServiceSid = optionalEnv(env, 'TWILIO_MESSAGING_SERVICE_SID');
  const fromNumber = optionalEnv(env, 'TWILIO_FROM_NUMBER');
  const consentCustomField = optionalEnv(env, 'SMS_CONSENT_CUSTOM_FIELD');

  const smsAnySet =
    Object.values(smsKeys).some((value) => value !== undefined) ||
    messagingServiceSid !== undefined ||
    fromNumber !== undefined;
  const smsMissing = [
    ...Object.entries(smsKeys)
      .filter(([, value]) => value === undefined)
      .map(([name]) => name),
    ...(messagingServiceSid === undefined && fromNumber === undefined
      ? ['TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_NUMBER']
      : []),
  ];
  const smsEnabled = smsAnySet && smsMissing.length === 0;
  if (smsAnySet && !smsEnabled) {
    problems.push(`SMS channel is incomplete, missing ${smsMissing.join(', ')}`);
  }
  // A SendGrid key without a sender address is fine when SMS is on: SMS texts are read with that key.
  if (!emailEnabled && (senderEmail || (sendGridApiKey && !smsEnabled))) {
    const missing = sendGridApiKey ? 'SENDER_EMAIL_ADDRESS' : 'SENDGRID_API_KEY';
    problems.push(`Email channel is incomplete, missing ${missing}`);
  }
  if (smsEnabled && !sendGridApiKey) {
    problems.push('SENDGRID_API_KEY is required for the SMS channel, because SMS templates are read from SendGrid');
  }
  checkFormat('TWILIO_ACCOUNT_SID', smsKeys.TWILIO_ACCOUNT_SID, TWILIO_ACCOUNT_SID_PATTERN, 'must match AC followed by 32 hex characters', problems);
  checkFormat('TWILIO_API_KEY_SID', smsKeys.TWILIO_API_KEY_SID, TWILIO_API_KEY_SID_PATTERN, 'must match SK followed by 32 hex characters', problems);
  checkFormat('TWILIO_MESSAGING_SERVICE_SID', messagingServiceSid, TWILIO_MESSAGING_SERVICE_SID_PATTERN, 'must match MG followed by 32 hex characters', problems);
  checkFormat('TWILIO_FROM_NUMBER', fromNumber, E164_PATTERN, 'must be an E.164 phone number', problems);

  if (!emailEnabled && !smsEnabled) {
    problems.push(
      'At least one channel must be configured: set SENDGRID_API_KEY and SENDER_EMAIL_ADDRESS for email, or the TWILIO_* keys for SMS'
    );
  }

  if (problems.length > 0) {
    throw new CustomError(
      'InvalidEnvironmentVariablesError',
      'Invalid channel configuration, please check your configuration.',
      problems.map((message) => ({ code: 'InvalidEnvironmentVariable', message }))
    );
  }

  const configuration: ChannelConfiguration = { defaultLocale: defaultLocale as string };
  if (emailEnabled) {
    configuration.email = {
      apiKey: sendGridApiKey as string,
      from: senderEmail as string,
      dataResidency,
    };
  }
  if (smsEnabled) {
    configuration.sms = {
      accountSid: smsKeys.TWILIO_ACCOUNT_SID as string,
      apiKeySid: smsKeys.TWILIO_API_KEY_SID as string,
      apiKeySecret: smsKeys.TWILIO_API_KEY_SECRET as string,
      messagingServiceSid,
      fromNumber,
      consentCustomField,
      templates: { apiKey: sendGridApiKey as string, dataResidency },
    };
  }
  return configuration;
};

/** Locale used to format data when the customer and order have none. */
export const readDefaultLocale = (): string => optionalEnv(process.env, 'DEFAULT_LOCALE') ?? 'en-US';
