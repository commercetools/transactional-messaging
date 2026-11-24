import type { NotificationKey } from '../shared/notifications/keys';

/** Starting points for new SMS templates, one per notification. Variables follow the variable picker. */
export const DEFAULT_SMS_TEXT: Record<NotificationKey, string> = {
  'customer-registration':
    'Welcome {{customerFirstName}}! Your account is ready.',
  'customer-password-reset':
    'Hi {{customerFirstName}}, use this code to reset your password: {{customerPasswordToken}}',
  'order-confirmation':
    'Hi {{customerFirstName}}, thanks for your order {{orderNumber}}. Total: {{orderTotalPrice}}.',
  'order-state-change': 'Your order {{orderNumber}} changed to {{orderState}}.',
  'shipment-state-change':
    'Your order {{orderNumber}} is now {{shipmentState}}.',
  'order-refund': "We've registered your return for order {{orderNumber}}.",
};
