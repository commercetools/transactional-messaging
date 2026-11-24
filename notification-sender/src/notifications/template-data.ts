// Shared with the Merchant Center app (see tools/sync-shared.mjs). Pure functions only: no I/O, no environment.
// The connector builds the data it sends with these, and the Merchant Center previews with the same ones,
// so a preview shows what a real message would contain.
import type {
  Address,
  Customer,
  LineItem,
  Order,
  TypedMoney,
} from '@commercetools/platform-sdk';

export type TemplateData = Record<string, unknown>;

/** What a builder returns: the locale used to format values, and the variables a template can use. */
export type BuiltData = { locale: string; templateData: TemplateData };

export type Token = { value: string; expiresAt: string };

// ---------------------------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------------------------

export const convertDateToText = (isoDate: string, locale: string) => {
  const asDate = new Date(isoDate);
  const date = asDate.toLocaleDateString(locale);
  const time = asDate.toLocaleTimeString(locale);
  return { date, time, dateTime: `${date} ${time}` };
};

export const convertMoneyToText = (
  money: TypedMoney,
  locale?: string
): string => {
  if (
    money.type === 'centPrecision' &&
    typeof money.centAmount === 'number' &&
    typeof money.fractionDigits === 'number'
  ) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: money.currencyCode,
    }).format(money.centAmount / Math.pow(10, money.fractionDigits));
  }
  return '';
};

export type LocalizedMap = Record<string, string>;

export const findFallbackLocale = (
  localizedString: LocalizedMap,
  fallbackOrder: string[]
) =>
  fallbackOrder
    .concat(Object.keys(localizedString))
    .find((lang) => Boolean(localizedString[lang]));

export const getPrimaryLocale = (locale: string): string =>
  locale.split('-')[0];

export const formatLocalizedString = (
  localizedString: LocalizedMap,
  locale: string | null,
  fallbackOrder: string[],
  fallback?: string
): string | undefined => {
  const fallbackLocale = findFallbackLocale(localizedString, fallbackOrder);
  const formattedLocalizedFallback = fallbackLocale
    ? localizedString[fallbackLocale]
    : fallback;

  if (!locale) return formattedLocalizedFallback;
  if (localizedString[locale]) return localizedString[locale];
  const primaryLocale = getPrimaryLocale(locale);
  if (localizedString[primaryLocale]) return localizedString[primaryLocale];
  return formattedLocalizedFallback;
};

// ---------------------------------------------------------------------------------------------
// Field mappers
// ---------------------------------------------------------------------------------------------

export const findLocale = (
  customer: Customer | undefined,
  order: Order | undefined,
  defaultLocale: string
): string =>
  customer?.locale ||
  order?.locale ||
  customer?.addresses?.[0]?.country ||
  order?.shippingAddress?.country ||
  defaultLocale;

export const mapEmail = (customer?: Customer, order?: Order) => ({
  customerEmail: order?.customerEmail || customer?.email || '',
});

export const mapNames = (customer?: Customer, order?: Order) => ({
  customerFirstName:
    customer?.firstName || order?.shippingAddress?.firstName || '',
  customerLastName:
    customer?.lastName || order?.shippingAddress?.lastName || '',
});

export const mapAddress = (customer?: Customer, order?: Order) => {
  const address: Partial<Address> | undefined = order?.shippingAddress;
  return {
    shippingAddress: {
      firstName: address?.firstName || customer?.firstName || '',
      lastName: address?.lastName || customer?.lastName || '',
      country: address?.country || '',
      streetName: address?.streetName || '',
      streetNumber: address?.streetNumber || '',
      additionalStreetInfo: address?.additionalStreetInfo || '',
      postalCode: address?.postalCode || '',
      city: address?.city || '',
      state: address?.state || '',
      company: address?.company || '',
    },
  };
};

export const mapLineItem = (
  lineItem: LineItem,
  locale: string,
  languages: string[]
) => ({
  productName: formatLocalizedString(lineItem.name, locale, languages),
  productQuantity: lineItem.quantity,
  productSku: lineItem.variant.sku,
  productImage: lineItem.variant.images?.[0]?.url ?? '',
  productSubTotal: convertMoneyToText(lineItem.totalPrice, locale),
});

export const mapOrderDefaults = (
  order: Order,
  customer: Customer | undefined,
  locale: string
) => {
  const dateAndTime = convertDateToText(order.createdAt, locale);
  return {
    orderNumber: order.orderNumber || '',
    ...mapEmail(customer, order),
    ...mapNames(customer, order),
    orderCreationTime: dateAndTime.time,
    orderCreationDate: dateAndTime.date,
    orderTotalPrice: convertMoneyToText(order.totalPrice, locale),
    orderTaxedPrice: order.taxedPrice
      ? convertMoneyToText(order.taxedPrice.totalNet, locale)
      : '',
  };
};

const mapCustomerDefaults = (customer: Customer, locale: string) => {
  const createdAt = convertDateToText(customer.createdAt, locale);
  return {
    ...mapEmail(customer),
    customerNumber: customer.customerNumber || '',
    ...mapNames(customer),
    customerCreationDate: createdAt.date,
    customerCreationTime: createdAt.time,
  };
};

// ---------------------------------------------------------------------------------------------
// Builders, one per notification
// ---------------------------------------------------------------------------------------------

type Shared = { defaultLocale: string };
type OrderInput = Shared & {
  order: Order;
  customer?: Customer;
  /** Project languages, used as the fallback order for localized names. */
  languages: string[];
};

export const buildOrderConfirmationData = ({
  order,
  customer,
  languages,
  defaultLocale,
}: OrderInput): BuiltData => {
  const locale = findLocale(customer, order, defaultLocale);
  return {
    locale,
    templateData: {
      ...mapOrderDefaults(order, customer, locale),
      orderLineItems: order.lineItems.map((lineItem) =>
        mapLineItem(lineItem, locale, languages)
      ),
      ...mapAddress(customer, order),
    },
  };
};

export const buildOrderStateChangeData = ({
  order,
  customer,
  defaultLocale,
  orderState,
  oldOrderState,
}: Omit<OrderInput, 'languages'> & {
  /** The order state, or the localized name of the state the order moved to. */
  orderState: string;
  oldOrderState: string;
}): BuiltData => {
  const locale = findLocale(customer, order, defaultLocale);
  return {
    locale,
    templateData: {
      ...mapOrderDefaults(order, customer, locale),
      orderState,
      oldOrderState,
    },
  };
};

export const buildShipmentStateChangeData = ({
  order,
  customer,
  defaultLocale,
  oldShipmentState,
}: Omit<OrderInput, 'languages'> & { oldShipmentState: string }): BuiltData => {
  const locale = findLocale(customer, order, defaultLocale);
  return {
    locale,
    templateData: {
      ...mapOrderDefaults(order, customer, locale),
      oldShipmentState,
      shipmentState: order.shipmentState,
    },
  };
};

export const buildOrderRefundData = ({
  order,
  customer,
  languages,
  defaultLocale,
  returnedLineItemIds,
}: OrderInput & { returnedLineItemIds: string[] }): BuiltData => {
  const locale = findLocale(customer, order, defaultLocale);
  return {
    locale,
    templateData: {
      ...mapOrderDefaults(order, customer, locale),
      orderState: order.orderState,
      orderShipmentState: order.shipmentState,
      orderLineItems: order.lineItems
        .filter((lineItem) => returnedLineItemIds.includes(lineItem.id))
        .map((lineItem) => mapLineItem(lineItem, locale, languages)),
    },
  };
};

export const buildCustomerRegistrationData = ({
  customer,
  defaultLocale,
  emailToken,
}: Shared & {
  customer: Customer;
  /** Present only when the customer's email is not verified yet. */
  emailToken?: Token;
}): BuiltData => {
  const locale = findLocale(customer, undefined, defaultLocale);
  const templateData: TemplateData = mapCustomerDefaults(customer, locale);
  if (emailToken) {
    const expires = convertDateToText(emailToken.expiresAt, locale);
    templateData.customerEmailToken = emailToken.value;
    templateData.customerEmailTokenValidityDate = expires.date;
    templateData.customerEmailTokenValidityTime = expires.time;
  }
  return { locale, templateData };
};

export const buildPasswordResetData = ({
  customer,
  defaultLocale,
  token,
}: Shared & { customer: Customer; token: Token }): BuiltData => {
  const locale = findLocale(customer, undefined, defaultLocale);
  const expires = convertDateToText(token.expiresAt, locale);
  return {
    locale,
    templateData: {
      ...mapCustomerDefaults(customer, locale),
      customerPasswordToken: token.value,
      customerPasswordTokenValidityDate: expires.date,
      customerPasswordTokenValidityTime: expires.time,
    },
  };
};
