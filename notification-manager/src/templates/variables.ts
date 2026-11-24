import type { NotificationKey } from '../shared/notifications/keys';
import { buildSampleData, SAMPLES } from '../shared/notifications/samples';
import { formatLocalizedString } from '../shared/notifications/template-data';
import { DEFAULT_LOCALIZATIONS } from '../shared/localizations';
import type { Localizations } from '../types';

/** The commercetools message type whose localization entry supplies `messages.*` for each notification. */
export const MESSAGE_TYPE: Record<NotificationKey, string> = {
  'customer-registration': 'CustomerCreated',
  'customer-password-reset': 'CustomerPasswordTokenCreated',
  'order-confirmation': 'OrderCreated',
  'order-state-change': 'OrderStateChanged',
  'shipment-state-change': 'OrderShipmentStateChanged',
  'order-refund': 'ReturnInfoAdded',
};

export type VariableGroup = 'data' | 'messages';

export type TemplateVariable = {
  /** Unique id for the picker. */
  id: string;
  group: VariableGroup;
  /** What the author sees in the list. */
  label: string;
  /** What is inserted into the editor. */
  token: string;
};

type LocalizationEntries = NonNullable<Localizations['entries']>;

const entriesOf = (localizations?: Localizations): LocalizationEntries =>
  localizations?.entries ?? DEFAULT_LOCALIZATIONS.entries;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** The variables the connector passes for the notification, read from the sample it is tested against. */
export const dataVariables = (
  notification: NotificationKey
): TemplateVariable[] => {
  const { templateData } = buildSampleData(notification);
  const variables: TemplateVariable[] = [];
  for (const [key, value] of Object.entries(templateData).sort(([a], [b]) =>
    a.localeCompare(b)
  )) {
    if (Array.isArray(value)) {
      const first = value[0];
      const fields = isRecord(first) ? Object.keys(first) : [];
      const body = fields.map((field) => `{{${field}}}`).join(' ');
      variables.push({
        id: `data:${key}`,
        group: 'data',
        label: `${key} (list)`,
        token: `{{#each ${key}}}${body}{{/each}}`,
      });
    } else if (isRecord(value)) {
      for (const field of Object.keys(value)) {
        variables.push({
          id: `data:${key}.${field}`,
          group: 'data',
          label: `${key}.${field}`,
          token: `{{${key}.${field}}}`,
        });
      }
    } else {
      variables.push({
        id: `data:${key}`,
        group: 'data',
        label: key,
        token: `{{${key}}}`,
      });
    }
  }
  return variables;
};

/** The `messages.*` variables of the notification's localization entry. */
export const messageVariables = (
  notification: NotificationKey,
  localizations?: Localizations
): TemplateVariable[] => {
  const entry = entriesOf(localizations).find(
    (candidate) => candidate.key === MESSAGE_TYPE[notification]
  );
  return (entry?.values ?? []).map((value) => ({
    id: `messages:${value.key}`,
    group: 'messages' as const,
    label: `messages.${value.key}`,
    token: `{{messages.${value.key}}}`,
  }));
};

export const allVariables = (
  notification: NotificationKey,
  localizations?: Localizations
): TemplateVariable[] => [
  ...dataVariables(notification),
  ...messageVariables(notification, localizations),
];

/** The localized texts for the preview, resolved for `locale` the same way the connector resolves them. */
export const sampleMessages = (
  notification: NotificationKey,
  localizations: Localizations | undefined,
  locale: string
): Record<string, string> => {
  const entry = entriesOf(localizations).find(
    (candidate) => candidate.key === MESSAGE_TYPE[notification]
  );
  const languages = SAMPLES[notification].languages;
  const result: Record<string, string> = {};
  for (const value of entry?.values ?? []) {
    result[value.key] =
      formatLocalizedString(value.label, locale, languages) ?? '';
  }
  return result;
};

/** The sample commercetools message, as the connector receives it. */
export const samplePayload = (notification: NotificationKey): string =>
  JSON.stringify(SAMPLES[notification].message, null, 2);
