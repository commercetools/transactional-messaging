import {
  createLocalizedString,
  isLocalizedStringEmpty,
} from './localized-string';

describe('createLocalizedString', () => {
  it('adds every project language and keeps existing values', () => {
    expect(
      createLocalizedString(['en-US', 'de-DE'], { 'de-DE': 'Hallo' })
    ).toEqual({
      'en-US': '',
      'de-DE': 'Hallo',
    });
  });
});

describe('isLocalizedStringEmpty', () => {
  it('is true for missing or blank values', () => {
    expect(isLocalizedStringEmpty(undefined)).toBe(true);
    expect(isLocalizedStringEmpty({ 'en-US': '  ' })).toBe(true);
  });
  it('is false when any language has text', () => {
    expect(isLocalizedStringEmpty({ 'en-US': '', 'de-DE': 'x' })).toBe(false);
  });
});
