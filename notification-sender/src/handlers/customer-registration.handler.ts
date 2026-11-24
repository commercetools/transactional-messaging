import type { CustomerCreatedMessage } from '@commercetools/platform-sdk';
import { HandlerType } from '../types/index.types';
import { createTokenForVerification, getCustomerById } from '../ctp/customer';
import { recipientOf } from '../utils/customer.utils';
import { buildCustomerRegistrationData } from '../notifications/template-data';
import { readDefaultLocale } from '../utils/config.utils';
import { resolveRecipientPhone } from '../sms/phone';

export const handleCustomerCreated: HandlerType<
  CustomerCreatedMessage
> = async (messageBody) => {
  // Re-fetch: the payload can be stale or omitted when payloadNotIncluded is set.
  const customer = await getCustomerById(messageBody.resource.id);
  const emailToken = customer.isEmailVerified
    ? undefined
    : await createTokenForVerification(customer.id);
  const { locale, templateData } = buildCustomerRegistrationData({
    customer,
    defaultLocale: readDefaultLocale(),
    emailToken,
  });

  return {
    notification: 'customer-registration',
    locale,
    templateData,
    recipients: {
      email: recipientOf(templateData.customerEmail),
      phone: resolveRecipientPhone(customer),
    },
    customer,
  };
};
