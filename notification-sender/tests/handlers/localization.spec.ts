import { formatLocalizedString } from '../../src/utils/localization.utils';

describe('formatLocalizedString', () => {
  const name = { 'en-US': 'Hello', 'de-DE': 'Hallo' };

  it('uses the exact locale', () => {
    expect(formatLocalizedString(name, 'de-DE', ['en-US'])).toBe('Hallo');
  });

  it('falls back to the project language order', () => {
    expect(formatLocalizedString(name, 'fr-FR', ['en-US'])).toBe('Hello');
  });
});
