import {
  buildCustomerRegistrationData,
  convertMoneyToText,
  findLocale,
  formatLocalizedString,
  mapLineItem,
} from '../../src/notifications/template-data';
import { SAMPLES, buildSampleData } from '../../src/notifications/samples';
import { NOTIFICATION_KEYS } from '../../src/notifications/keys';
import type { Customer, LineItem } from '@commercetools/platform-sdk';

describe('sample data', () => {
  it.each(NOTIFICATION_KEYS)(
    '%s builds data with an email address and no undefined values',
    (key) => {
      const { templateData, locale } = buildSampleData(key);
      expect(locale).toBe('en-US');
      expect(templateData.customerEmail).toBe('jane.doe@example.com');
      expect(Object.values(templateData)).not.toContain(undefined);
    }
  );

  it.each(NOTIFICATION_KEYS)('%s sample message names its resource', (key) => {
    const { message } = SAMPLES[key];
    expect(message.notificationType).toBe('Message');
    expect(message.resource).toMatchObject({ id: expect.any(String) });
  });

  it('only lists the returned line items for a refund', () => {
    const items = buildSampleData('order-refund').templateData
      .orderLineItems as Array<{ productSku: string }>;
    expect(items.map((item) => item.productSku)).toEqual(['SKU-2']);
  });

  it('omits the token fields for a customer whose email is verified', () => {
    const customer = {
      ...SAMPLES['customer-registration'].resources.customer,
      isEmailVerified: true,
    } as Customer;
    const { templateData } = buildCustomerRegistrationData({
      customer,
      defaultLocale: 'en-US',
    });
    expect(templateData).not.toHaveProperty('customerEmailToken');
  });
});

describe('convertMoneyToText', () => {
  it('formats zero amounts instead of dropping them', () => {
    expect(
      convertMoneyToText(
        {
          type: 'centPrecision',
          currencyCode: 'EUR',
          centAmount: 0,
          fractionDigits: 2,
        },
        'en-US'
      )
    ).toBe('€0.00');
  });

  it('returns an empty string for high precision money', () => {
    expect(
      convertMoneyToText(
        {
          type: 'highPrecision',
          currencyCode: 'EUR',
          centAmount: 1,
          fractionDigits: 4,
          preciseAmount: 10,
        },
        'en-US'
      )
    ).toBe('');
  });
});

describe('findLocale', () => {
  it('prefers the customer, then the order, then the default', () => {
    expect(
      findLocale({ locale: 'de-DE' } as Customer, undefined, 'en-US')
    ).toBe('de-DE');
    expect(findLocale(undefined, undefined, 'fr-FR')).toBe('fr-FR');
  });
});

describe('formatLocalizedString', () => {
  const name = { 'en-US': 'Cap', de: 'Kappe' };
  it('falls back from the full locale to the primary language to the project order', () => {
    expect(formatLocalizedString(name, 'en-US', [])).toBe('Cap');
    expect(formatLocalizedString(name, 'de-DE', [])).toBe('Kappe');
    expect(formatLocalizedString(name, 'fr-FR', ['de'])).toBe('Kappe');
  });
});

describe('mapLineItem', () => {
  it('does not fail on a variant without images', () => {
    const lineItem = {
      name: { 'en-US': 'Cap' },
      quantity: 1,
      variant: { id: 1, sku: 'SKU-2', images: [] },
      totalPrice: {
        type: 'centPrecision',
        currencyCode: 'EUR',
        centAmount: 100,
        fractionDigits: 2,
      },
    } as unknown as LineItem;
    expect(mapLineItem(lineItem, 'en-US', []).productImage).toBe('');
  });
});
