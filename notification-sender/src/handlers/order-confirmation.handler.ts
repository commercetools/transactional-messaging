import {
  OrderCreatedMessage,
  OrderImportedMessage,
} from '@commercetools/platform-sdk';
import { HandlerType } from '../types/index.types';
import { recipientOf } from '../utils/customer.utils';
import { getCustomerFromOrder } from '../utils/order.utils';
import { buildOrderConfirmationData } from '../notifications/template-data';
import { readDefaultLocale } from '../utils/config.utils';
import { getOrderById } from '../ctp/order';
import { resolveRecipientPhone } from '../sms/phone';

export const handleOrderCreatedMessage: HandlerType<
  OrderCreatedMessage | OrderImportedMessage
> = async (messageBody, languages) => {
  // Re-fetch: the payload can be stale or omitted when payloadNotIncluded is set.
  const order = await getOrderById(messageBody.resource.id);
  const customer = await getCustomerFromOrder(order);
  const { locale, templateData } = buildOrderConfirmationData({
    order,
    customer,
    languages,
    defaultLocale: readDefaultLocale(),
  });

  return {
    notification: 'order-confirmation',
    locale,
    templateData,
    recipients: {
      email: recipientOf(templateData.customerEmail),
      phone: resolveRecipientPhone(customer, order),
    },
    customer,
    order,
  };
};
