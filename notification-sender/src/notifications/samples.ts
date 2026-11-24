// Shared with the Merchant Center app (see tools/sync-shared.mjs). Fake data only (example.com, SKU-1, ...).
// The Merchant Center shows `message` as the sample payload and renders the preview from `buildSampleData`.
import type { Customer, Order } from '@commercetools/platform-sdk';
import type { NotificationKey } from './keys';
import {
  buildCustomerRegistrationData,
  buildOrderConfirmationData,
  buildOrderRefundData,
  buildOrderStateChangeData,
  buildPasswordResetData,
  buildShipmentStateChangeData,
  type BuiltData,
  type Token,
} from './template-data';

/** Everything the connector fetches after it receives the message, because the message alone is not enough. */
export type SampleResources = {
  order?: Order;
  customer?: Customer;
  emailToken?: Token;
  passwordToken?: Token;
};

export type Sample = {
  /** The commercetools Message as the connector receives it, decoded from the Pub/Sub envelope. */
  message: Record<string, unknown>;
  resources: SampleResources;
  /** Project languages, the fallback order for localized names. */
  languages: string[];
};

const PROJECT_KEY = 'my-project';
const ORDER_ID = '7b0f1c1a-1f0e-4b9a-9d0a-1a2b3c4d5e6f';
const CUSTOMER_ID = '2c1d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f';
const CREATED_AT = '2026-01-02T10:00:00.000Z';

const money = (centAmount: number) => ({
  type: 'centPrecision',
  currencyCode: 'EUR',
  centAmount,
  fractionDigits: 2,
});

const SAMPLE_CUSTOMER = {
  id: CUSTOMER_ID,
  version: 3,
  customerNumber: '100042',
  email: 'jane.doe@example.com',
  firstName: 'Jane',
  lastName: 'Doe',
  locale: 'en-US',
  isEmailVerified: false,
  createdAt: CREATED_AT,
  lastModifiedAt: CREATED_AT,
  addresses: [],
} as unknown as Customer;

const SAMPLE_ORDER = {
  id: ORDER_ID,
  version: 5,
  orderNumber: '100042',
  customerId: CUSTOMER_ID,
  customerEmail: 'jane.doe@example.com',
  locale: 'en-US',
  createdAt: CREATED_AT,
  lastModifiedAt: CREATED_AT,
  orderState: 'Confirmed',
  shipmentState: 'Shipped',
  totalPrice: money(4990),
  taxedPrice: {
    totalNet: money(4110),
    totalGross: money(4990),
    taxPortions: [],
  },
  lineItems: [
    {
      id: 'line-item-1',
      productId: 'product-1',
      name: { 'en-US': 'Example T-shirt', 'de-DE': 'Beispiel-T-Shirt' },
      quantity: 2,
      variant: {
        id: 1,
        sku: 'SKU-1',
        images: [
          {
            url: 'https://www.example.com/images/t-shirt.jpg',
            dimensions: { w: 600, h: 600 },
          },
        ],
      },
      totalPrice: money(3980),
    },
    {
      id: 'line-item-2',
      productId: 'product-2',
      name: { 'en-US': 'Example cap', 'de-DE': 'Beispiel-Kappe' },
      quantity: 1,
      variant: { id: 1, sku: 'SKU-2', images: [] },
      totalPrice: money(1010),
    },
  ],
  shippingAddress: {
    firstName: 'Jane',
    lastName: 'Doe',
    streetName: 'Main Street',
    streetNumber: '1',
    additionalStreetInfo: '',
    postalCode: '10001',
    city: 'New York',
    state: 'NY',
    country: 'US',
    company: '',
  },
} as unknown as Order;

const LANGUAGES = ['en-US', 'de-DE'];

/** Fields every Message carries, so the sample reads like a real delivery. */
const envelope = (
  type: string,
  resource: { typeId: string; id: string },
  extra: Record<string, unknown>
) => ({
  notificationType: 'Message',
  projectKey: PROJECT_KEY,
  id: '5d6e7f80-9a0b-4c1d-8e2f-3a4b5c6d7e8f',
  version: 1,
  sequenceNumber: 2,
  resource,
  resourceVersion: 2,
  type,
  createdAt: CREATED_AT,
  lastModifiedAt: CREATED_AT,
  ...extra,
});

const ORDER_REF = { typeId: 'order', id: ORDER_ID };
const CUSTOMER_REF = { typeId: 'customer', id: CUSTOMER_ID };

export const SAMPLES: Record<NotificationKey, Sample> = {
  'order-confirmation': {
    // OrderCreated embeds the whole order, so the connector could use it as it is.
    message: envelope('OrderCreated', ORDER_REF, { order: SAMPLE_ORDER }),
    resources: { order: SAMPLE_ORDER, customer: SAMPLE_CUSTOMER },
    languages: LANGUAGES,
  },
  'order-state-change': {
    // The message only references the order, so the connector fetches it.
    message: envelope('OrderStateChanged', ORDER_REF, {
      orderState: 'Confirmed',
      oldOrderState: 'Open',
    }),
    resources: { order: SAMPLE_ORDER, customer: SAMPLE_CUSTOMER },
    languages: LANGUAGES,
  },
  'shipment-state-change': {
    message: envelope('OrderShipmentStateChanged', ORDER_REF, {
      shipmentState: 'Shipped',
      oldShipmentState: 'Ready',
    }),
    resources: { order: SAMPLE_ORDER, customer: SAMPLE_CUSTOMER },
    languages: LANGUAGES,
  },
  'order-refund': {
    message: envelope('ReturnInfoAdded', ORDER_REF, {
      returnInfo: {
        returnTrackingId: 'RETURN-1',
        returnDate: CREATED_AT,
        items: [
          {
            type: 'LineItemReturnItem',
            id: 'return-item-1',
            quantity: 1,
            lineItemId: 'line-item-2',
            comment: '',
            shipmentState: 'Returned',
            paymentState: 'Initial',
            lastModifiedAt: CREATED_AT,
            createdAt: CREATED_AT,
          },
        ],
      },
    }),
    resources: { order: SAMPLE_ORDER, customer: SAMPLE_CUSTOMER },
    languages: LANGUAGES,
  },
  'customer-registration': {
    // CustomerCreated carries the customer, but the connector fetches it again and mints the email token.
    message: envelope('CustomerCreated', CUSTOMER_REF, {
      customer: SAMPLE_CUSTOMER,
    }),
    resources: {
      customer: SAMPLE_CUSTOMER,
      emailToken: {
        value: 'sample-email-verification-token',
        expiresAt: '2026-01-02T12:00:00.000Z',
      },
    },
    languages: LANGUAGES,
  },
  'customer-password-reset': {
    message: envelope(
      'CustomerPasswordTokenCreated',
      { typeId: 'customer-password-token', id: 'token-1' },
      {
        customerId: CUSTOMER_ID,
        expiresAt: '2026-01-02T11:00:00.000Z',
        value: 'sample-password-reset-token',
      }
    ),
    resources: {
      customer: SAMPLE_CUSTOMER,
      passwordToken: {
        value: 'sample-password-reset-token',
        expiresAt: '2026-01-02T11:00:00.000Z',
      },
    },
    languages: LANGUAGES,
  },
};

/** The data a template receives for the sample, built exactly as the connector builds it. */
export const buildSampleData = (
  notification: NotificationKey,
  defaultLocale = 'en-US'
): BuiltData => {
  const { resources, languages } = SAMPLES[notification];
  const order = resources.order as Order;
  const customer = resources.customer as Customer;
  switch (notification) {
    case 'order-confirmation':
      return buildOrderConfirmationData({
        order,
        customer,
        languages,
        defaultLocale,
      });
    case 'order-state-change':
      return buildOrderStateChangeData({
        order,
        customer,
        defaultLocale,
        orderState: 'Confirmed',
        oldOrderState: 'Open',
      });
    case 'shipment-state-change':
      return buildShipmentStateChangeData({
        order,
        customer,
        defaultLocale,
        oldShipmentState: 'Ready',
      });
    case 'order-refund':
      return buildOrderRefundData({
        order,
        customer,
        languages,
        defaultLocale,
        returnedLineItemIds: ['line-item-2'],
      });
    case 'customer-registration':
      return buildCustomerRegistrationData({
        customer,
        defaultLocale,
        emailToken: resources.emailToken,
      });
    case 'customer-password-reset':
      return buildPasswordResetData({
        customer,
        defaultLocale,
        token: resources.passwordToken as Token,
      });
  }
};
