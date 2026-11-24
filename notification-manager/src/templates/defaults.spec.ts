import { NOTIFICATION_KEYS } from '../shared/notifications/keys';
import { defaultContent, nextOnDefaultChange } from './defaults';
import { DEFAULT_EMAIL_MJML } from './defaults-email';

describe('defaultContent', () => {
  it('has an MJML and an SMS default for every notification', () => {
    for (const key of NOTIFICATION_KEYS) {
      expect(defaultContent(key, 'email')).toContain('<mjml>');
      expect(defaultContent(key, 'sms').length).toBeGreaterThan(10);
    }
  });
});

describe('nextOnDefaultChange', () => {
  const previousDefault = DEFAULT_EMAIL_MJML['order-confirmation'];
  const nextDefault = DEFAULT_EMAIL_MJML['order-refund'];

  it('swaps to the new default while the text is still the previous default', () => {
    expect(
      nextOnDefaultChange({
        current: previousDefault,
        previousDefault,
        nextDefault,
      })
    ).toBe(nextDefault);
  });

  it('swaps when the text is empty, including the first pick', () => {
    expect(
      nextOnDefaultChange({
        current: '  ',
        previousDefault: undefined,
        nextDefault,
      })
    ).toBe(nextDefault);
  });

  it('keeps text the author changed', () => {
    expect(
      nextOnDefaultChange({
        current: `${previousDefault}<!-- mine -->`,
        previousDefault,
        nextDefault,
      })
    ).toContain('<!-- mine -->');
  });
});
