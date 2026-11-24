import { NOTIFICATION_KEYS } from '../shared/notifications/keys';
import {
  allVariables,
  dataVariables,
  messageVariables,
  sampleMessages,
  samplePayload,
} from './variables';

describe('variables', () => {
  it('lists the data variables the connector passes', () => {
    const tokens = dataVariables('order-confirmation').map((v) => v.token);
    expect(tokens).toContain('{{orderNumber}}');
    expect(tokens).toContain('{{shippingAddress.city}}');
    expect(
      tokens.find((t) => t.startsWith('{{#each orderLineItems}}'))
    ).toContain('{{productName}}');
  });

  it('lists messages.* from the default localizations', () => {
    expect(
      messageVariables('order-confirmation').map((v) => v.token)
    ).toContain('{{messages.heroMessage}}');
  });

  it('prefers the localizations the project saved', () => {
    const saved = {
      key: 'transactional-emails',
      entries: [
        {
          key: 'OrderCreated',
          name: { en: 'x' },
          values: [{ key: 'custom', label: { 'en-US': 'Custom' } }],
        },
      ],
    };
    expect(
      messageVariables('order-confirmation', saved).map((v) => v.token)
    ).toEqual(['{{messages.custom}}']);
    expect(sampleMessages('order-confirmation', saved, 'en-US')).toEqual({
      custom: 'Custom',
    });
  });

  it('resolves localized texts for the locale, falling back to the language', () => {
    const messages = sampleMessages(
      'customer-registration',
      undefined,
      'de-DE'
    );
    expect(messages.welcome).toBe('Hey');
    expect(messages.text).toBe('Vielen Dank für Ihre Anmeldung!');
  });

  it('has no whitespace in any variable name and a payload for every notification', () => {
    for (const key of NOTIFICATION_KEYS) {
      for (const variable of allVariables(key)) {
        expect(variable.token).not.toMatch(/\{\{\s|\s\}\}/);
        expect(variable.label).not.toMatch(/^\s|\s$|:/);
      }
      expect(JSON.parse(samplePayload(key)).type).toEqual(expect.any(String));
    }
  });
});
