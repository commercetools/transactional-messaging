import { readChannelConfiguration } from '../utils/config.utils';
import { createSendGridEmailProvider } from './sendgrid.email-provider';
import { createSendGridSmsTemplateSource } from './sendgrid.sms-templates';
import { createTwilioSmsProvider } from './twilio.sms-provider';
import type { EmailProvider, SmsProvider, SmsTemplateSource } from './types';

export type Providers = { email?: EmailProvider; sms?: SmsProvider; smsTemplates?: SmsTemplateSource };

/** Per-call budget for each provider (plan §6.4): the event must be acknowledged within about 10 seconds. */
const PROVIDER_TIMEOUT_MS = 4000;

let cached: Providers | undefined;

/** Builds the providers for the channels that are configured. Configuration errors throw. */
export const getProviders = (): Providers => {
  if (cached) return cached;
  const configuration = readChannelConfiguration();
  const providers: Providers = {};
  if (configuration.email) {
    providers.email = createSendGridEmailProvider({
      apiKey: configuration.email.apiKey,
      from: configuration.email.from,
      dataResidency: configuration.email.dataResidency,
      timeoutMs: PROVIDER_TIMEOUT_MS,
    });
  }
  if (configuration.sms) {
    const { templates, ...twilio } = configuration.sms;
    providers.sms = createTwilioSmsProvider({ ...twilio, timeoutMs: PROVIDER_TIMEOUT_MS });
    providers.smsTemplates = createSendGridSmsTemplateSource({ ...templates, timeoutMs: PROVIDER_TIMEOUT_MS });
  }
  cached = providers;
  return providers;
};

/** Tests only. */
export const resetProvidersForTests = (): void => {
  cached = undefined;
};
