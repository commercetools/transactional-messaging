import {
  permissionNames,
  readConfiguration,
  readServiceConfiguration,
} from '../src/config';
import { normaliseServiceUrl } from '../src/connector/service-url';

const service = {
  SENDGRID_API_KEY: 'SG.abc',
  CLOUD_IDENTIFIER: 'gcp-eu',
  ENTRY_POINT_URI_PATH: 'acme-transactional-messaging',
  CONNECT_SERVICE_URL:
    'https://service-1.europe-west1.gcp.commercetools.app/templateApi',
};

describe('readServiceConfiguration', () => {
  it('reads a valid configuration and uses the origin as the token audience', () => {
    expect(readServiceConfiguration(service)).toMatchObject({
      sendGridApiKey: 'SG.abc',
      dataResidency: 'global',
      audience: 'https://service-1.europe-west1.gcp.commercetools.app',
    });
  });

  it('prefers TEMPLATE_API_PUBLIC_URL when set', () => {
    expect(
      readServiceConfiguration({
        ...service,
        TEMPLATE_API_PUBLIC_URL: 'https://templates.example.com/anything',
      }).audience
    ).toBe('https://templates.example.com');
  });

  it.each([
    ['SENDGRID_API_KEY', { SENDGRID_API_KEY: '' }],
    ['SENDGRID_API_KEY', { SENDGRID_API_KEY: 'nope' }],
    ['SENDGRID_DATA_RESIDENCY', { SENDGRID_DATA_RESIDENCY: 'mars' }],
    ['CLOUD_IDENTIFIER', { CLOUD_IDENTIFIER: '' }],
    ['ENTRY_POINT_URI_PATH', { ENTRY_POINT_URI_PATH: '' }],
    [
      'CONNECT_SERVICE_URL',
      { CONNECT_SERVICE_URL: 'http://plain.example.com' },
    ],
    ['CONNECT_SERVICE_URL', { CONNECT_SERVICE_URL: '' }],
  ])(
    'names %s when it is invalid and never prints values',
    (name, override) => {
      let message = '';
      try {
        readServiceConfiguration({ ...service, ...override });
      } catch (error) {
        message = JSON.stringify((error as { errors?: unknown }).errors);
      }
      expect(message).toContain(name);
      expect(message).not.toContain('SG.abc');
    }
  );
});

describe('readConfiguration', () => {
  it('requires the commercetools API variables', () => {
    expect(() => readConfiguration({})).toThrow();
    expect(
      readConfiguration({
        CTP_PROJECT_KEY: 'p',
        CTP_CLIENT_ID: 'i',
        CTP_CLIENT_SECRET: 's',
        CTP_API_URL: 'https://api.example.com',
        CTP_AUTH_URL: 'https://auth.example.com',
      }).projectKey
    ).toBe('p');
  });
});

describe('permissionNames', () => {
  it('matches the names the application shell derives', () => {
    expect(permissionNames('acme-transactional-messaging')).toEqual({
      view: 'canViewAcmeTransactionalMessaging',
      manage: 'canManageAcmeTransactionalMessaging',
    });
  });
});

describe('normaliseServiceUrl', () => {
  it('keeps the endpoint path and drops a trailing slash', () => {
    expect(normaliseServiceUrl('https://s.example.com/templateApi/')).toBe(
      'https://s.example.com/templateApi'
    );
  });

  it('rejects missing, malformed and non-https values', () => {
    expect(() => normaliseServiceUrl(undefined)).toThrow('not set');
    expect(() => normaliseServiceUrl('nope')).toThrow('not a valid URL');
    expect(() => normaliseServiceUrl('http://s.example.com')).toThrow('https');
  });
});
