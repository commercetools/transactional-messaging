import type { Customer, Order } from '@commercetools/platform-sdk';
import type { NotificationKey } from './keys';

/**
 * Channel-agnostic result of a handler. The dispatcher decides which channels send.
 * `customer` and `order` are used for the consent check and are never logged.
 */
export type NotificationContext = {
  notification: NotificationKey;
  locale: string;
  /** Exactly the data the email templates receive today. Keys must not be renamed. */
  templateData: Record<string, unknown>;
  recipients: { email?: string; phone?: string };
  customer?: Customer;
  order?: Order;
};
