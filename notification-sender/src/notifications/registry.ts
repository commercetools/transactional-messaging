import type { NotificationKey } from './keys';

export * from './keys';

/** One place that maps commercetools message types to notification keys (plan Phase 7 §7.2). */
export const NOTIFICATION_BY_MESSAGE_TYPE: Readonly<Record<string, NotificationKey>> = {
  CustomerCreated: 'customer-registration',
  CustomerPasswordTokenCreated: 'customer-password-reset',
  OrderCreated: 'order-confirmation',
  OrderImported: 'order-confirmation',
  OrderStateChanged: 'order-state-change',
  OrderStateTransition: 'order-state-change',
  OrderShipmentStateChanged: 'shipment-state-change',
  ReturnInfoAdded: 'order-refund',
  ReturnInfoSet: 'order-refund',
};

/** Legacy email fallback: SendGrid template ID env var per notification (appendix B §2, D9). */
export const LEGACY_EMAIL_TEMPLATE_ENV: Readonly<Record<NotificationKey, string>> = {
  'customer-registration': 'CUSTOMER_REGISTRATION_TEMPLATE_ID',
  'customer-password-reset': 'CUSTOMER_PASSWORD_TOKEN_CREATION_TEMPLATE_ID',
  'order-confirmation': 'ORDER_CONFIRMATION_TEMPLATE_ID',
  'order-state-change': 'ORDER_STATE_CHANGE_TEMPLATE_ID',
  'shipment-state-change': 'SHIPMENT_STATE_CHANGE_TEMPLATE_ID',
  'order-refund': 'ORDER_REFUND_TEMPLATE_ID',
};

export const notificationForMessageType = (messageType: string): NotificationKey | undefined =>
  Object.prototype.hasOwnProperty.call(NOTIFICATION_BY_MESSAGE_TYPE, messageType)
    ? NOTIFICATION_BY_MESSAGE_TYPE[messageType]
    : undefined;
