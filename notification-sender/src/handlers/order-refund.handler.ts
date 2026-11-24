import CustomError from '../errors/custom.error';
import { HTTP_STATUS_BAD_REQUEST } from '../constants/http-status.constants';
import {
  ReturnInfoAddedMessage,
  ReturnInfoSetMessage,
  ReturnInfo,
} from '@commercetools/platform-sdk';
import { getOrderById } from '../ctp/order';
import { HandlerType } from '../types/index.types';
import { recipientOf } from '../utils/customer.utils';
import { logger } from '../utils/logger.utils';
import { getCustomerFromOrder } from '../utils/order.utils';
import { buildOrderRefundData } from '../notifications/template-data';
import { readDefaultLocale } from '../utils/config.utils';
import { resolveRecipientPhone } from '../sms/phone';

const resolveLineItemIds = (
  returnInfoInput: Array<ReturnInfo> | ReturnInfo | undefined,
  orderId: string
) => {
  if (!returnInfoInput) {
    logger.info(`No returned line item is found for order ${orderId}`);
    return undefined;
  }
  const returnInfo: Array<ReturnInfo> = Array.isArray(returnInfoInput)
    ? returnInfoInput
    : [returnInfoInput];

  return returnInfo
    .flatMap((returnInfo) => returnInfo.items)
    .map((item) => {
      return 'lineItemId' in item ? item.lineItemId : '';
    });
};

export const handleReturnInfo: HandlerType<
  ReturnInfoAddedMessage | ReturnInfoSetMessage
> = async (messageBody, languages) => {
  const orderId = messageBody.resource.id;
  const order = await getOrderById(orderId);
  if (order) {
    const customer = await getCustomerFromOrder(order);
    const returnedLineItemId = resolveLineItemIds(
      messageBody.returnInfo,
      orderId
    );
    if (!returnedLineItemId) {
      return undefined;
    }
    const built = buildOrderRefundData({
      order,
      customer,
      languages,
      defaultLocale: readDefaultLocale(),
      returnedLineItemIds: returnedLineItemId,
    });
    const returnedLineItems = built.templateData.orderLineItems as unknown[];

    if (returnedLineItems.length > 0) {
      return {
        notification: 'order-refund',
        locale: built.locale,
        templateData: built.templateData,
        recipients: {
          email: recipientOf(built.templateData.customerEmail),
          phone: resolveRecipientPhone(customer, order),
        },
        customer,
        order,
      };
    } else {
      throw new CustomError(
        HTTP_STATUS_BAD_REQUEST,
        `No returned line item is found for order ${orderId}`
      );
    }
  } else {
    throw new CustomError(
      HTTP_STATUS_BAD_REQUEST,
      `Unable to get order details with order ID ${orderId}`
    );
  }
};
