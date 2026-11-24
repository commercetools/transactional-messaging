import CustomError from '../errors/custom.error';
import { HTTP_STATUS_BAD_REQUEST } from '../constants/http-status.constants';
import { OrderStateChangedMessage } from '@commercetools/platform-sdk';
import { getOrderById } from '../ctp/order';
import { HandlerType } from '../types/index.types';
import { recipientOf } from '../utils/customer.utils';
import { getCustomerFromOrder } from '../utils/order.utils';
import { buildOrderStateChangeData } from '../notifications/template-data';
import { readDefaultLocale } from '../utils/config.utils';
import { resolveRecipientPhone } from '../sms/phone';

export const handleOrderStateChanged: HandlerType<
  OrderStateChangedMessage
> = async (messageBody, _languages) => {
  const orderId = messageBody.resource.id;
  const order = await getOrderById(orderId);
  if (!order) {
    throw new CustomError(
      HTTP_STATUS_BAD_REQUEST,
      `Unable to get order details with order ID ${orderId}`
    );
  }
  const customer = await getCustomerFromOrder(order);
  const { locale, templateData } = buildOrderStateChangeData({
    order,
    customer,
    defaultLocale: readDefaultLocale(),
    orderState: order.orderState,
    oldOrderState: messageBody.oldOrderState ?? '',
  });

  return {
    notification: 'order-state-change',
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
