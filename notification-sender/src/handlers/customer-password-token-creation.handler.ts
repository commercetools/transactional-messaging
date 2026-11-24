import type { CustomerPasswordTokenCreatedMessage } from '@commercetools/platform-sdk';
import { generatePasswordResetToken, getCustomerById } from '../ctp/customer';
import { HandlerType } from '../types/index.types';
import CustomError from '../errors/custom.error';
import { recipientOf } from '../utils/customer.utils';
import { buildPasswordResetData } from '../notifications/template-data';
import { readDefaultLocale } from '../utils/config.utils';
import { PASSWORD_RESET_TOKEN_TTL_MINUTES } from '../constants/tokens';
import { resolveRecipientPhone } from '../sms/phone';

/**
 * Uses the token carried by the message whenever it is present (tokens valid for 60 minutes or less).
 * Minting a new token here would emit another CustomerPasswordTokenCreated message, so mint only as a fallback,
 * and with the short TTL, so the replacement message carries its value as well.
 */
export const handleCustomerPasswordTokenCreated: HandlerType<
  CustomerPasswordTokenCreatedMessage
> = async (messageBody) => {
  const customer = await getCustomerById(messageBody.customerId);

  let tokenValue = messageBody.value;
  let tokenExpiresAt = messageBody.expiresAt;
  if (!tokenValue) {
    const minted = await generatePasswordResetToken(
      customer.email,
      PASSWORD_RESET_TOKEN_TTL_MINUTES
    );
    if (!minted) {
      throw new CustomError(
        400,
        'Unable to generate a password reset token for the customer.'
      );
    }
    tokenValue = minted.value;
    tokenExpiresAt = minted.expiresAt;
  }

  const { locale, templateData } = buildPasswordResetData({
    customer,
    defaultLocale: readDefaultLocale(),
    token: { value: tokenValue, expiresAt: tokenExpiresAt },
  });

  return {
    notification: 'customer-password-reset',
    locale,
    templateData,
    recipients: {
      email: recipientOf(templateData.customerEmail),
      phone: resolveRecipientPhone(customer),
    },
    customer,
  };
};
