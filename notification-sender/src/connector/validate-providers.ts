import client from '@sendgrid/client';
import twilio from 'twilio';
import type { ChannelConfiguration } from '../utils/config.utils';

/** HTTP status from either SDK: SendGrid uses `code`, Twilio uses `status`. */
const statusOf = (error: unknown): string => {
  const e = error as { statusCode?: unknown; status?: unknown; code?: unknown };
  for (const candidate of [e?.statusCode, e?.status, e?.code]) {
    if (typeof candidate === 'number') return String(candidate);
  }
  return 'no response';
};

/**
 * Checks the SendGrid key and that it holds the scopes the enabled channels need (mail.send for email,
 * templates.read for SMS texts). Error messages name the channel and status, never the key.
 */
export const validateSendGridCredentials = async (
  apiKey: string,
  requiredScopes: readonly string[] = ['mail.send']
): Promise<void> => {
  client.setApiKey(apiKey);
  let statusCode: number;
  let scopes: unknown;
  try {
    const [response, body] = await client.request({ method: 'GET', url: '/v3/scopes' });
    statusCode = response.statusCode;
    scopes = (body as { scopes?: unknown } | undefined)?.scopes;
  } catch (error) {
    throw new Error(`SendGrid credential check failed (HTTP ${statusOf(error)})`, { cause: error });
  }
  if (statusCode !== 200) {
    throw new Error(`SendGrid credential check failed (HTTP ${statusCode})`);
  }
  for (const scope of requiredScopes) {
    if (!Array.isArray(scopes) || !scopes.includes(scope)) {
      throw new Error(`SendGrid API key does not include the ${scope} permission`);
    }
  }
};

type SmsConfiguration = NonNullable<ChannelConfiguration['sms']>;

/** Checks the Twilio API key and account, and the Messaging Service when one is configured. */
export const validateTwilioCredentials = async (sms: SmsConfiguration): Promise<void> => {
  const twilioClient = twilio(sms.apiKeySid, sms.apiKeySecret, { accountSid: sms.accountSid, timeout: 10000 });
  try {
    await twilioClient.api.v2010.accounts(sms.accountSid).fetch();
    if (sms.messagingServiceSid) {
      await twilioClient.messaging.v1.services(sms.messagingServiceSid).fetch();
    }
  } catch (error) {
    throw new Error(`Twilio credential check failed (HTTP ${statusOf(error)})`, { cause: error });
  }
};

/** Validates only the channels that are configured. Fails the deployment rather than deploy a connector that cannot send. */
export const validateProviders = async (channels: ChannelConfiguration): Promise<void> => {
  const sendGridKey = channels.email?.apiKey ?? channels.sms?.templates.apiKey;
  if (sendGridKey) {
    const scopes = [...(channels.email ? ['mail.send'] : []), ...(channels.sms ? ['templates.read'] : [])];
    await validateSendGridCredentials(sendGridKey, scopes);
  }
  if (channels.sms) await validateTwilioCredentials(channels.sms);
};
