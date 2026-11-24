import { getCustomObjectByContainerAndKey } from '../ctp/custom-objects';
import { logger } from './logger.utils';
import * as defaultLocalizations from './localizations.json';

export { formatLocalizedString } from '../notifications/template-data';
import { formatLocalizedString } from '../notifications/template-data';

export const loadAdditionalLocalizations = async (
  key: string,
  locale: string,
  fallbackOrder: string[],
  dynamic = true
) => {
  let additionalConfig = defaultLocalizations as {
    name: Record<string, string>;
    entries: Array<{
      key: string;
      name: Record<string, string>;
      values: Array<{
        key: string;
        label: Record<string, string>;
      }>;
    }>;
  };
  if (dynamic) {
    try {
      const localizations = await getCustomObjectByContainerAndKey(
        'localizations',
        'transactional-emails'
      );
      additionalConfig = localizations.value;
    } catch {
      logger.info('No Localizations found in custom object');
    }
  }
  const config = additionalConfig.entries.find((entry) => entry.key === key);
  if (!config) {
    logger.info(`No Localization config found for key ${key}`);
    return undefined;
  }
  return config.values.reduce(
    (acc, current) => ({
      ...acc,
      [current.key]: formatLocalizedString(
        current.label,
        locale,
        fallbackOrder
      ),
    }),
    {}
  );
};
