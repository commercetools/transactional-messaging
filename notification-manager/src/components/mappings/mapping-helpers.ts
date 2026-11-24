import type { MessageDescriptor } from 'react-intl';
import {
  CHANNELS,
  NOTIFICATION_KEYS,
  type Channel,
  type NotificationKey,
} from '../../shared/notifications/keys';
import {
  parseNotificationMapping,
  mappingKey,
  TEMPLATE_ID_PATTERN,
  type NotificationMapping,
} from '../../shared/mappings/notification-mapping';
import messages from './messages';

export type ErrorCode = 'required' | 'invalidSendGridId' | 'duplicate';

export type MappingFormValues = {
  notification: NotificationKey | '';
  channel: Channel;
  enabled: boolean;
  /** SendGrid dynamic template ID, for both email and SMS (SMS texts are SendGrid templates too). */
  templateId: string;
};

export type MappingFormErrors = {
  notification?: ErrorCode;
  templateId?: ErrorCode;
};

export const NOTIFICATION_LABELS: Record<NotificationKey, MessageDescriptor> = {
  'customer-registration': messages.notification_customer_registration,
  'customer-password-reset': messages.notification_customer_password_reset,
  'order-confirmation': messages.notification_order_confirmation,
  'order-state-change': messages.notification_order_state_change,
  'shipment-state-change': messages.notification_shipment_state_change,
  'order-refund': messages.notification_order_refund,
};

export const ERROR_MESSAGES: Record<ErrorCode, MessageDescriptor> = {
  required: messages.error_required,
  invalidSendGridId: messages.error_invalidSendGridId,
  duplicate: messages.error_duplicate,
};

export const emptyFormValues = (): MappingFormValues => ({
  notification: '',
  channel: 'email',
  enabled: false,
  templateId: '',
});

export const hasFormErrors = (errors: MappingFormErrors): boolean =>
  Boolean(errors.notification || errors.templateId);

/** Validates the form. `existingKeys` is only passed when creating, to block overwriting an existing mapping. */
export const validateMappingForm = (
  values: MappingFormValues,
  existingKeys: readonly string[] = []
): MappingFormErrors => {
  const errors: MappingFormErrors = {};

  if (!values.notification) {
    errors.notification = 'required';
    return errors;
  }
  if (existingKeys.includes(mappingKey(values.notification, values.channel))) {
    errors.notification = 'duplicate';
  }

  const id = values.templateId.trim();
  if (!id) errors.templateId = 'required';
  else if (!TEMPLATE_ID_PATTERN.test(id))
    errors.templateId = 'invalidSendGridId';
  return errors;
};

/**
 * Builds the Custom Object value. It round-trips through the shared parser, so any drift
 * between this form and the connector throws here instead of being saved.
 */
export const buildMappingValue = (
  values: MappingFormValues
): NotificationMapping => {
  if (!values.notification) throw new Error('A notification must be selected.');
  const parsed = parseNotificationMapping({
    schemaVersion: 2,
    notification: values.notification,
    channel: values.channel,
    enabled: values.enabled,
    templateId: values.templateId.trim(),
  });
  if (!parsed)
    throw new Error('The mapping does not match the connector schema.');
  return parsed;
};

export const mappingObjectKey = (values: MappingFormValues): string =>
  mappingKey(values.notification as NotificationKey, values.channel);

export const allChannels = (): readonly Channel[] => CHANNELS;
export const allNotifications = (): readonly NotificationKey[] =>
  NOTIFICATION_KEYS;
