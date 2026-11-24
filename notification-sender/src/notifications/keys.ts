// Shared with the Merchant Center app (see tools/sync-shared.mjs). Keep this file free of imports.

export const NOTIFICATION_KEYS = [
  'customer-registration',
  'customer-password-reset',
  'order-confirmation',
  'order-state-change',
  'shipment-state-change',
  'order-refund',
] as const;

export type NotificationKey = (typeof NOTIFICATION_KEYS)[number];

export const CHANNELS = ['email', 'sms'] as const;

export type Channel = (typeof CHANNELS)[number];

export const isNotificationKey = (value: unknown): value is NotificationKey =>
  typeof value === 'string' && (NOTIFICATION_KEYS as readonly string[]).includes(value);

export const isChannel = (value: unknown): value is Channel =>
  typeof value === 'string' && (CHANNELS as readonly string[]).includes(value);
