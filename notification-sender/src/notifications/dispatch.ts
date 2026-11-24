import { logger } from '../utils/logger.utils';
import { classifyError } from '../errors/classify';
import { DeliveryError, type Correlation, type FailureKind } from '../providers/types';
import type { Providers } from '../providers';
import type { ChannelConfiguration } from '../utils/config.utils';
import { renderSms, SMS_MAX_LENGTH } from '../sms/render-sms';
import { hasSmsConsent } from './consent';
import type { NotificationContext } from './context';
import type { Channel } from './keys';
import { resolveEmailTemplate } from './resolve';
import type { NotificationMapping } from '../mappings/notification-mapping';
import { mappingKey } from '../mappings/notification-mapping';

export type SkipReason =
  | 'no-template'
  | 'disabled'
  | 'no-recipient'
  | 'no-consent'
  | 'channel-not-configured';

export type ChannelOutcome =
  | { channel: Channel; status: 'sent'; providerId?: string }
  | { channel: Channel; status: 'skipped'; reason: SkipReason }
  | { channel: Channel; status: 'failed'; kind: FailureKind; reason: string };

export type DispatchDependencies = {
  templates: ReadonlyMap<string, NotificationMapping>;
  providers: Providers;
  channels: ChannelConfiguration;
  /** Localized texts, exposed to templates as `messages`. */
  messages?: Record<string, unknown>;
  messageId: string;
  resourceId: string;
};

const correlationOf = (context: NotificationContext, deps: DispatchDependencies): Correlation => ({
  messageId: deps.messageId,
  resourceId: deps.resourceId,
  notification: context.notification,
});

/** Runs one channel. A failure in one channel never prevents the other channel from running. */
const runChannel = async (
  channel: Channel,
  send: () => Promise<ChannelOutcome>
): Promise<ChannelOutcome> => {
  try {
    return await send();
  } catch (error) {
    if (error instanceof DeliveryError) {
      return { channel, status: 'failed', kind: error.kind, reason: error.message };
    }
    // Unknown errors: classify by any HTTP status; no status (network, timeout) is transient.
    return { channel, status: 'failed', kind: classifyError(error), reason: 'unexpected-error' };
  }
};

const sendEmail = async (context: NotificationContext, deps: DispatchDependencies): Promise<ChannelOutcome> => {
  const resolution = resolveEmailTemplate(
    context.notification,
    deps.templates,
    deps.channels.email?.fallbackTemplateIds ?? {}
  );
  if (resolution.type === 'skip') return { channel: 'email', status: 'skipped', reason: resolution.reason };

  const provider = deps.providers.email;
  if (!provider) {
    logger.warn('Email channel not configured', { notification: context.notification });
    return { channel: 'email', status: 'skipped', reason: 'channel-not-configured' };
  }
  if (!context.recipients.email) return { channel: 'email', status: 'skipped', reason: 'no-recipient' };

  await provider.send({
    to: [context.recipients.email],
    templateId: resolution.sendGridTemplateId,
    data: { ...(deps.messages ? { messages: deps.messages } : {}), ...context.templateData },
    correlation: correlationOf(context, deps),
  });
  return { channel: 'email', status: 'sent' };
};

const sendSms = async (context: NotificationContext, deps: DispatchDependencies): Promise<ChannelOutcome> => {
  const template = deps.templates.get(mappingKey(context.notification, 'sms'));
  if (!template) return { channel: 'sms', status: 'skipped', reason: 'no-template' };
  if (!template.enabled) return { channel: 'sms', status: 'skipped', reason: 'disabled' };

  const provider = deps.providers.sms;
  const templates = deps.providers.smsTemplates;
  if (!provider || !templates) {
    logger.warn('SMS channel not configured', { notification: context.notification });
    return { channel: 'sms', status: 'skipped', reason: 'channel-not-configured' };
  }
  if (!context.recipients.phone) return { channel: 'sms', status: 'skipped', reason: 'no-recipient' };
  if (!hasSmsConsent(deps.channels.sms?.consentCustomField, context)) {
    return { channel: 'sms', status: 'skipped', reason: 'no-consent' };
  }

  // Throws a DeliveryError: transient when SendGrid is unreachable, permanent when the template is gone or empty.
  const source = await templates.fetch(template.templateId);

  let body: string;
  try {
    body = renderSms(source, { ...(deps.messages ? { messages: deps.messages } : {}), ...context.templateData });
  } catch {
    // A template saved before validation existed. Permanent for SMS only.
    return { channel: 'sms', status: 'failed', kind: 'permanent', reason: 'template-render-failed' };
  }
  if (body.length > SMS_MAX_LENGTH) {
    logger.warn('SMS body truncated', { notification: context.notification, length: body.length });
    body = body.slice(0, SMS_MAX_LENGTH);
  }

  const result = await provider.send({
    to: context.recipients.phone,
    body,
    correlation: correlationOf(context, deps),
  });
  return { channel: 'sms', status: 'sent', providerId: result.sid };
};

/** Email first, then SMS. Each channel has its own try/catch, so a failure in one never blocks the other. */
export const dispatchNotification = async (
  context: NotificationContext,
  deps: DispatchDependencies
): Promise<ChannelOutcome[]> => [
  await runChannel('email', () => sendEmail(context, deps)),
  await runChannel('sms', () => sendSms(context, deps)),
];

/**
 * Retry only when nothing was delivered, so a channel that succeeded is never sent twice on redelivery.
 * Acknowledge with 204 when any channel sent. Request a redelivery (503) only when no channel sent and
 * at least one failed transiently. Everything else is acknowledged.
 */
export const decideAck = (outcomes: ChannelOutcome[]): 204 | 503 => {
  if (outcomes.some((outcome) => outcome.status === 'sent')) return 204;
  if (outcomes.some((outcome) => outcome.status === 'failed' && outcome.kind === 'transient')) return 503;
  return 204;
};
