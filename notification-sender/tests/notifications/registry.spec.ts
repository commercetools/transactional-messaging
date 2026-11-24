import { NOTIFICATION_BY_MESSAGE_TYPE, LEGACY_EMAIL_TEMPLATE_ENV, NOTIFICATION_KEYS, notificationForMessageType } from '../../src/notifications/registry';
import { SUBSCRIPTION_MESSAGES } from '../../src/connector/subscription';

describe('notification registry', () => {
  it('maps exactly the message types that the Subscription delivers', () => {
    const subscribed = SUBSCRIPTION_MESSAGES.flatMap((m) => m.types ?? []).sort();
    const mapped = Object.keys(NOTIFICATION_BY_MESSAGE_TYPE).sort();
    expect(mapped).toEqual(subscribed);
  });

  it('covers every notification key with at least one message type', () => {
    const used = new Set(Object.values(NOTIFICATION_BY_MESSAGE_TYPE));
    for (const key of NOTIFICATION_KEYS) expect(used.has(key)).toBe(true);
  });

  it('has a legacy env var for every notification key', () => {
    for (const key of NOTIFICATION_KEYS) expect(LEGACY_EMAIL_TEMPLATE_ENV[key]).toMatch(/_TEMPLATE_ID$/);
  });

  it('does not resolve inherited object properties as message types', () => {
    expect(notificationForMessageType('constructor')).toBeUndefined();
    expect(notificationForMessageType('OrderCreated')).toBe('order-confirmation');
  });
});
