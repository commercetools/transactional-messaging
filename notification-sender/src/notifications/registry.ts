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

export const notificationForMessageType = (messageType: string): NotificationKey | undefined =>
  Object.prototype.hasOwnProperty.call(NOTIFICATION_BY_MESSAGE_TYPE, messageType)
    ? NOTIFICATION_BY_MESSAGE_TYPE[messageType]
    : undefined;
