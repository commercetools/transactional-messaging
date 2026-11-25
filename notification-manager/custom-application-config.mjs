// No imports: Connect evaluates this file with Node inside the container, where importing
// TypeScript sources is not reliable.

/**
 * Same derivation as entryPointUriPathToPermissionKeys from @commercetools-frontend/application-shell/ssr.
 * Keep the two in step (see src/permission-keys.spec.ts).
 */
export const toPermissionKeys = (uriPath) => {
  const resource = uriPath
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return { View: `View${resource}`, Manage: `Manage${resource}` };
};

const PERMISSIONS = toPermissionKeys(
  process.env.ENTRY_POINT_URI_PATH ?? 'placeholder'
);

// Local development only: call the template service at this localhost URL directly, without the
// Merchant Center proxy (which refuses http). A production build, as Connect runs it, never uses it.
const isProduction =
  (process.env.MC_APP_ENV ?? process.env.NODE_ENV ?? 'development') ===
  'production';
const devUrl = process.env.TEMPLATE_API_DEV_URL?.trim();
const templateApiDevUrl =
  !isProduction &&
  devUrl &&
  /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/.test(devUrl)
    ? devUrl
    : undefined;

/** @type {import('@commercetools-frontend/application-config').ConfigOptionsForCustomApplication} */
const config = {
  name: 'Transactional Messaging',
  entryPointUriPath: '${env:ENTRY_POINT_URI_PATH}',
  cloudIdentifier: '${env:CLOUD_IDENTIFIER}',
  env: {
    development: {
      // Development only. Connect never sets this, so it is read from the local environment.
      initialProjectKey:
        process.env.INITIAL_PROJECT_KEY ?? 'set-INITIAL_PROJECT_KEY-in-env',
    },
    production: {
      applicationId: '${env:CUSTOM_APPLICATION_ID}',
      url: '${env:APPLICATION_URL}',
    },
  },
  additionalEnv: templateApiDevUrl ? { templateApiDevUrl } : {},
  oAuthScopes: {
    view: ['view_key_value_documents'],
    manage: ['manage_key_value_documents'],
  },
  headers: {
    csp: {
      // The dev service is called straight from the browser, so the page may connect to it.
      'connect-src': templateApiDevUrl
        ? [new URL(templateApiDevUrl).origin]
        : [],
      'script-src': ["'unsafe-inline'", "'unsafe-eval'"],
    },
  },
  icon: '${path:@commercetools-frontend/assets/application-icons/rocket.svg}',
  mainMenuLink: {
    defaultLabel: 'Transactional messaging',
    labelAllLocales: [],
    permissions: [PERMISSIONS.View],
  },
  submenuLinks: [
    {
      uriPath: 'templates',
      defaultLabel: 'Templates',
      labelAllLocales: [],
      permissions: [PERMISSIONS.View],
    },
    {
      uriPath: 'mappings',
      defaultLabel: 'Mappings',
      labelAllLocales: [],
      permissions: [PERMISSIONS.View],
    },
    {
      uriPath: 'localizations',
      defaultLabel: 'Localizations',
      labelAllLocales: [],
      permissions: [PERMISSIONS.View],
    },
  ],
};

export default config;
