import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import type { Address, Customer, Order } from '@commercetools/platform-sdk';

type Candidate = { raw?: string; country?: string };

const candidatesFrom = (address?: Address): Candidate[] =>
  address
    ? [
        { raw: address.mobile, country: address.country },
        { raw: address.phone, country: address.country },
      ]
    : [];

/**
 * Normalises the recipient's mobile number to E.164.
 * Order: order shipping, order billing, customer default shipping, then any customer address.
 * Within an address, `mobile` is preferred over `phone`. Invalid numbers are skipped.
 */
export const resolveRecipientPhone = (customer?: Customer, order?: Order): string | undefined => {
  const defaultShipping = customer?.addresses?.find((a) => a.id === customer.defaultShippingAddressId);
  const candidates = [
    ...candidatesFrom(order?.shippingAddress),
    ...candidatesFrom(order?.billingAddress),
    ...candidatesFrom(defaultShipping),
    ...(customer?.addresses ?? []).flatMap(candidatesFrom),
  ];
  for (const { raw, country } of candidates) {
    if (!raw) continue;
    const region = country?.toUpperCase() as CountryCode | undefined;
    const parsed = parsePhoneNumberFromString(raw, region);
    if (parsed?.isValid()) return parsed.number;
  }
  return undefined;
};
