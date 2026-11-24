import {
  isChannel,
  isNotificationKey,
  type Channel,
  type NotificationKey,
} from '../shared/notifications/keys';

/**
 * What the Merchant Center remembers about a template it saved. SendGrid keeps the compiled HTML; the MJML the
 * author wrote, and the notification it was written for, live here. Templates without a record were created in
 * SendGrid's own editor and are shown read-only.
 */
export type TemplateSource = {
  schemaVersion: 1;
  notification: NotificationKey;
  channel: Channel;
  /** Email only. */
  mjml?: string;
};

export const parseTemplateSource = (
  value: unknown
): TemplateSource | undefined => {
  if (typeof value !== 'object' || value === null) return undefined;
  const candidate = value as Record<string, unknown>;
  if (
    candidate.schemaVersion !== 1 ||
    !isNotificationKey(candidate.notification) ||
    !isChannel(candidate.channel)
  ) {
    return undefined;
  }
  return {
    schemaVersion: 1,
    notification: candidate.notification,
    channel: candidate.channel,
    ...(typeof candidate.mjml === 'string' ? { mjml: candidate.mjml } : {}),
  };
};
