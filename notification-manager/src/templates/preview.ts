import Handlebars from 'handlebars';
import type { NotificationKey } from '../shared/notifications/keys';
import { buildSampleData } from '../shared/notifications/samples';
import { renderSms } from '../shared/sms/render-sms';
import type { Localizations } from '../types';
import { sampleMessages } from './variables';

// Isolated instance with HTML escaping on, like the SendGrid template engine.
const hbs = Handlebars.create();

export type Preview = {
  /** The rendered text, or undefined when the source could not be rendered. */
  output?: string;
  /** Problems the author can fix: MJML validation messages or a Handlebars parse error. */
  errors: string[];
};

/** The data a template receives for the sample: `messages` plus the notification's own values. */
export const previewData = (
  notification: NotificationKey,
  localizations: Localizations | undefined,
  locale: string
): Record<string, unknown> => {
  const { templateData } = buildSampleData(notification, locale);
  return {
    messages: sampleMessages(notification, localizations, locale),
    ...templateData,
  };
};

type MjmlCompiler = (
  source: string,
  options: { validationLevel: 'soft' }
) => { html: string; errors: Array<{ line: number; message: string }> };

/** mjml-browser is large, so it loads when the first preview is needed. */
export const loadMjml = async (): Promise<MjmlCompiler> =>
  (await import('mjml-browser')).default as MjmlCompiler;

export const renderHandlebars = (
  source: string,
  data: Record<string, unknown>
): Preview => {
  try {
    return { output: hbs.compile(source)(data), errors: [] };
  } catch (error) {
    return { errors: [(error as Error).message] };
  }
};

/** MJML to HTML, with the author's variables left in place. This is what is stored in SendGrid. */
export const compileMjml = (
  compile: MjmlCompiler,
  source: string
): { html?: string; errors: string[] } => {
  try {
    const { html, errors } = compile(source, { validationLevel: 'soft' });
    return {
      html,
      errors: errors.map((error) => `Line ${error.line}: ${error.message}`),
    };
  } catch (error) {
    return { errors: [(error as Error).message] };
  }
};

export const renderEmailPreview = (
  compile: MjmlCompiler,
  mjmlSource: string,
  data: Record<string, unknown>
): Preview => {
  const compiled = compileMjml(compile, mjmlSource);
  if (compiled.html === undefined) return { errors: compiled.errors };
  const rendered = renderHandlebars(compiled.html, data);
  return { ...rendered, errors: [...compiled.errors, ...rendered.errors] };
};

export const renderSmsPreview = (
  source: string,
  data: Record<string, unknown>
): Preview => {
  try {
    return { output: renderSms(source, data), errors: [] };
  } catch (error) {
    return { errors: [(error as Error).message] };
  }
};

/** Renders a subject line, which is Handlebars without HTML. */
export const renderSubject = (
  source: string,
  data: Record<string, unknown>
): string => {
  try {
    return Handlebars.create().compile(source, { noEscape: true })(data);
  } catch {
    return source;
  }
};
