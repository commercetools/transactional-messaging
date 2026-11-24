export type LocalizedString = Record<string, string>;

/** One entry per project language, keeping existing values. Replaces the ui-kit helper. */
export const createLocalizedString = (
  languages: string[],
  existing: LocalizedString = {}
): LocalizedString =>
  languages.reduce<LocalizedString>(
    (acc, language) => ({ ...acc, [language]: existing[language] ?? '' }),
    {
      ...existing,
    }
  );

/** True when every language value is blank. Replaces the ui-kit helper. */
export const isLocalizedStringEmpty = (
  value: LocalizedString | undefined
): boolean =>
  !value || Object.values(value).every((text) => text.trim().length === 0);
