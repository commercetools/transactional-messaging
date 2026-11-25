import type { NotificationContext } from './context';

/**
 * SMS consent. With no field configured, consent is not checked: the merchant is responsible
 * (documented in the README). With a field, a customer or guest order must carry `true` in that field.
 */
export const hasSmsConsent = (fieldName: string | undefined, context: NotificationContext): boolean => {
  if (!fieldName) return true;
  return (
    context.customer?.custom?.fields?.[fieldName] === true ||
    context.order?.custom?.fields?.[fieldName] === true
  );
};
