// Shared with the Merchant Center app (see tools/sync-shared.mjs). Keep the only import below.
import Handlebars from 'handlebars';

// Isolated instance: no globally registered helpers.
const hbs = Handlebars.create();

/** Twilio rejects bodies longer than 1600 characters. */
export const SMS_MAX_LENGTH = 1600;

/** Returns an error message if the template does not compile, otherwise undefined. */
export const validateSmsTemplate = (source: string): string | undefined => {
  try {
    hbs.precompile(source);
    return undefined;
  } catch (error) {
    return (error as Error).message;
  }
};

/** Plain-text rendering: no HTML escaping, collapse runs of spaces, trim. Missing variables render as empty. */
export const renderSms = (source: string, data: Record<string, unknown>): string =>
  hbs
    .compile(source, { noEscape: true, strict: false })(data)
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
