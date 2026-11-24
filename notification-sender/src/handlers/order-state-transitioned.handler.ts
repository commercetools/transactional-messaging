import CustomError from '../errors/custom.error';
import { HTTP_STATUS_BAD_REQUEST } from '../constants/http-status.constants';
import {
  OrderStateTransitionMessage,
  State,
} from '@commercetools/platform-sdk';
import { getOrderById } from '../ctp/order';
import { HandlerType } from '../types/index.types';
import { findLocale, recipientOf } from '../utils/customer.utils';
import { getCustomerFromOrder } from '../utils/order.utils';
import {
  formatLocalizedString,
  buildOrderStateChangeData,
} from '../notifications/template-data';
import { readDefaultLocale } from '../utils/config.utils';
import { getStateById } from '../ctp/state';
import { resolveRecipientPhone } from '../sms/phone';

export const handleOrderStateTransitioned: HandlerType<
  OrderStateTransitionMessage
> = async (messageBody, languages) => {
  const orderId = messageBody.resource.id;
  const order = await getOrderById(orderId);
  if (!order) {
    throw new CustomError(
      HTTP_STATUS_BAD_REQUEST,
      `Unable to get order details with order ID ${orderId}`
    );
  }
  const customer = await getCustomerFromOrder(order);
  let oldState: State | undefined = undefined;
  const newState: State = await getStateById(messageBody.state.id);
  if (messageBody.oldState) {
    oldState = await getStateById(messageBody.oldState?.id);
  }

  // State names are localized with the same locale the builder will pick for the order.
  const locale = findLocale(customer, order);
  const { templateData } = buildOrderStateChangeData({
    order,
    customer,
    defaultLocale: readDefaultLocale(),
    orderState:
      formatLocalizedString(newState.name || {}, locale, languages) ?? '',
    oldOrderState:
      formatLocalizedString(oldState?.name || {}, locale, languages) ?? '',
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
