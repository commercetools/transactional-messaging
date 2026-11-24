import type { Channel, NotificationKey } from '../shared/notifications/keys';
import { DEFAULT_EMAIL_MJML } from './defaults-email';
import { DEFAULT_SMS_TEXT } from './defaults-sms';

export const DEFAULT_SUBJECT: Record<NotificationKey, string> = {
  'customer-registration': 'Welcome, {{customerFirstName}}!',
  'customer-password-reset': 'Reset your password',
  'order-confirmation': 'Your order {{orderNumber}} is confirmed',
  'order-state-change': 'Your order {{orderNumber}} is {{orderState}}',
  'shipment-state-change': 'Your order {{orderNumber}} is {{shipmentState}}',
  'order-refund': 'Your return for order {{orderNumber}}',
};

export const defaultContent = (
  notification: NotificationKey,
  channel: Channel
): string =>
  channel === 'email'
    ? DEFAULT_EMAIL_MJML[notification]
    : DEFAULT_SMS_TEXT[notification];

/**
 * Picking another notification (or channel) swaps the text only while the author has not changed it:
 * empty, or still the previous default. Anything else is kept.
 */
export const nextOnDefaultChange = ({
  current,
  previousDefault,
  nextDefault,
}: {
  current: string;
  previousDefault: string | undefined;
  nextDefault: string;
}): string => {
  const untouched =
    current.trim() === '' ||
    (previousDefault !== undefined && current === previousDefault);
  return untouched ? nextDefault : current;
};
