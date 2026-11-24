import { Client } from '@sendgrid/client';
import { DeliveryError, type SmsTemplateSource } from './types';
import { withTimeout } from './timeout';
import { toSendGridError } from './sendgrid.email-provider';

export type SmsTemplateSourceOptions = {
  apiKey: string;
  dataResidency: 'global' | 'eu';
  timeoutMs: number;
  /** How long a fetched text is reused. An edit in the Merchant Center reaches SMS within this time. */
  ttlMs?: number;
  now?: () => number;
};

type SendGridVersion = { active: number; plain_content?: string; html_content?: string };
type SendGridTemplate = { name?: string; generation?: string; versions?: SendGridVersion[] };

/** The template service names SMS templates with this prefix; email templates must never be sent as SMS. */
export const SMS_NAME_PREFIX = '[SMS] ';

const DEFAULT_TTL_MS = 5 * 60 * 1000;

/** The SMS text is kept in the active version's plain_content (see the template-api service). */
export const textOf = (template: SendGridTemplate): string | undefined => {
  const version = template.versions?.find((candidate) => candidate.active === 1) ?? template.versions?.[0];
  const text = version?.plain_content ?? version?.html_content;
  return text && text.trim().length > 0 ? text : undefined;
};

/**
 * Reads SMS templates from SendGrid. Texts are cached per template; when SendGrid is unreachable a cached
 * text is used, even if it has expired, so an outage does not stop messages that were sendable a minute ago.
 */
export const createSendGridSmsTemplateSource = ({
  apiKey,
  dataResidency,
  timeoutMs,
  ttlMs = DEFAULT_TTL_MS,
  now = Date.now,
}: SmsTemplateSourceOptions): SmsTemplateSource => {
  const client = new Client();
  client.setApiKey(apiKey);
  if (dataResidency === 'eu') client.setDataResidency('eu');
  const cache = new Map<string, { text: string; at: number }>();

  return {
    async fetch(templateId) {
      const cached = cache.get(templateId);
      if (cached && now() - cached.at < ttlMs) return cached.text;

      try {
        const [, body] = await withTimeout(
          client.request({ method: 'GET', url: `v3/templates/${templateId}` }),
          timeoutMs,
          () => new DeliveryError('SendGrid request timed out', 'transient', 'sendgrid')
        );
        const template = body as SendGridTemplate;
        if (!template.name?.startsWith(SMS_NAME_PREFIX)) {
          throw new DeliveryError('Template is not an SMS template', 'permanent', 'sendgrid');
        }
        const text = textOf(template);
        if (!text) throw new DeliveryError('SMS template has no text', 'permanent', 'sendgrid');
        cache.set(templateId, { text, at: now() });
        return text;
      } catch (error) {
        const failure = error instanceof DeliveryError ? error : toSendGridError(error);
        // A missing or empty template is a configuration problem; do not hide it behind an old copy.
        if (failure.kind === 'transient' && cached) return cached.text;
        throw failure;
      }
    },
  };
};
