import { entryPointUriPathToPermissionKeys } from '@commercetools-frontend/application-shell/ssr';

declare const window: Window &
  typeof globalThis & { app: { entryPointUriPath: string } };

/**
 * mc-scripts does not inline process.env into the browser bundle, so the runtime value
 * comes from window.app. There is deliberately no hard-coded fallback: the entry point must be configured.
 */
export const entryPointUriPath: string =
  typeof window === 'undefined'
    ? (process.env.ENTRY_POINT_URI_PATH as string)
    : window.app.entryPointUriPath;

export const PERMISSIONS = entryPointUriPathToPermissionKeys(entryPointUriPath);

/** Custom Object container that stores the localization entries. Kept for compatibility with existing data. */
export const CONTAINER_KEY = 'localizations';

/** Where the connector stores the URL of the template service (written by its post-deploy script). */
export const SERVICE_CONFIG_CONTAINER = 'transactional-messaging';
export const SERVICE_CONFIG_KEY = 'template-api';

/** Custom Object container that remembers which notification each template was written for. Key = SendGrid template ID. */
export const TEMPLATE_SOURCES_CONTAINER = 'notification-template-sources';

/** Custom Object container for template parts (reusable MJML). Key = the part's include path without `.mjml`. */
export const TEMPLATE_PARTS_CONTAINER = 'notification-template-parts';

/** Custom Object that holds the localization entries. */
export const LOCALIZATIONS_KEY = 'transactional-emails';
