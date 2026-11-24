import { hasSmsConsent } from '../../src/notifications/consent';
import type { NotificationContext } from '../../src/notifications/context';

const context = (customerFields?: Record<string, unknown>, orderFields?: Record<string, unknown>): NotificationContext => ({
  notification: 'order-confirmation',
  locale: 'en-US',
  templateData: {},
  recipients: {},
  customer: customerFields ? ({ custom: { fields: customerFields } } as never) : undefined,
  order: orderFields ? ({ custom: { fields: orderFields } } as never) : undefined,
});

describe('hasSmsConsent', () => {
  it('allows SMS when no consent field is configured', () => {
    expect(hasSmsConsent(undefined, context())).toBe(true);
  });

  it('allows SMS when the customer consented', () => {
    expect(hasSmsConsent('smsConsent', context({ smsConsent: true }))).toBe(true);
  });

  it('allows SMS for a guest order that consented', () => {
    expect(hasSmsConsent('smsConsent', context(undefined, { smsConsent: true }))).toBe(true);
  });

  it('refuses when the field is missing or false', () => {
    expect(hasSmsConsent('smsConsent', context())).toBe(false);
    expect(hasSmsConsent('smsConsent', context({ smsConsent: false }))).toBe(false);
    expect(hasSmsConsent('smsConsent', context({ smsConsent: 'true' }))).toBe(false);
  });
});
