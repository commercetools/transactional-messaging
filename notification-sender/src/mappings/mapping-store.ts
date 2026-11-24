import { createApiRoot } from '../client/create.client';
import { logger } from '../utils/logger.utils';
import {
  MAPPINGS_CONTAINER,
  parseNotificationMapping,
  mappingKey,
  type NotificationMapping,
} from './notification-mapping';

/** Upper bound on mappings. There is at most one per notification and channel (about 12 in total). */
const PAGE_LIMIT = 500;

/**
 * Loads the merchant's mappings once per message, so an edit in the Merchant Center applies to the next message.
 * An empty or missing container is not an error. Invalid objects are ignored and logged by key only.
 */
export const loadMappings = async (): Promise<Map<string, NotificationMapping>> => {
  const { body } = await createApiRoot()
    .customObjects()
    .withContainer({ container: MAPPINGS_CONTAINER })
    .get({ queryArgs: { limit: PAGE_LIMIT } })
    .execute();

  const mappings = new Map<string, NotificationMapping>();
  for (const object of body.results) {
    const parsed = parseNotificationMapping(object.value);
    if (parsed && object.key === mappingKey(parsed.notification, parsed.channel)) {
      mappings.set(object.key, parsed);
    } else {
      logger.warn('Ignoring invalid notification template', { key: object.key });
    }
  }
  return mappings;
};
