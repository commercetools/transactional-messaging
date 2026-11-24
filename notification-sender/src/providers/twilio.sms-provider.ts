import twilio from 'twilio';
import { DeliveryError, type SmsProvider } from './types';

export type TwilioOptions = {
  accountSid: string;
  apiKeySid: string;
  apiKeySecret: string;
  messagingServiceSid?: string;
  fromNumber?: string;
  timeoutMs: number;
};

export const toTwilioError = (error: unknown): DeliveryError => {
  const e = error as { status?: unknown; code?: unknown };
  const status = typeof e?.status === 'number' ? e.status : undefined; // HTTP status
  const code = typeof e?.code === 'number' ? e.code : undefined; // Twilio error code, e.g. 21211
  if (status === undefined) return new DeliveryError('Twilio request failed', 'transient', 'twilio');
  const kind = status === 429 || status >= 500 ? 'transient' : 'permanent';
  return new DeliveryError(
    `Twilio responded ${status}${code ? ` (code ${code})` : ''}`,
    kind,
    'twilio',
    code
  );
};

export const createTwilioSmsProvider = (options: TwilioOptions): SmsProvider => {
  // API key authentication: individual keys can be revoked without touching the account token.
  const client = twilio(options.apiKeySid, options.apiKeySecret, {
    accountSid: options.accountSid,
    timeout: options.timeoutMs,
    autoRetry: true, // retries 429 with backoff
    maxRetries: 1, // keep the total time under the event ack budget
  });

  return {
    async send({ to, body }) {
      try {
        const message = await client.messages.create({
          to,
          body,
          ...(options.messagingServiceSid
            ? { messagingServiceSid: options.messagingServiceSid }
            : { from: options.fromNumber }),
        });
        return { sid: message.sid };
      } catch (error) {
        throw toTwilioError(error);
      }
    },
  };
};
