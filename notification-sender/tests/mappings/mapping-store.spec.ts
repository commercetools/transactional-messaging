import { loadMappings } from '../../src/mappings/mapping-store';

const mockExecute = jest.fn();

jest.mock('../../src/client/create.client', () => ({
  createApiRoot: () => ({
    customObjects: () => ({
      withContainer: () => ({ get: () => ({ execute: () => mockExecute() }) }),
    }),
  }),
}));
jest.mock('../../src/utils/logger.utils', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const emailObject = {
  key: 'order-confirmation-email',
  value: {
    schemaVersion: 2,
    notification: 'order-confirmation',
    channel: 'email',
    enabled: true,
    templateId: 'd-0123456789abcdef0123456789abcdef',
  },
};
const smsObject = {
  key: 'order-confirmation-sms',
  value: {
    schemaVersion: 2,
    notification: 'order-confirmation',
    channel: 'sms',
    enabled: false,
    templateId: 'd-0123456789abcdef0123456789abcdef',
  },
};

describe('loadMappings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads valid templates keyed by their Custom Object key', async () => {
    mockExecute.mockResolvedValue({ body: { results: [emailObject, smsObject] } });
    const templates = await loadMappings();
    expect([...templates.keys()].sort()).toEqual(['order-confirmation-email', 'order-confirmation-sms']);
    expect(templates.get('order-confirmation-sms')?.enabled).toBe(false);
  });

  it('ignores invalid values', async () => {
    mockExecute.mockResolvedValue({ body: { results: [{ key: 'order-confirmation-email', value: { schemaVersion: 9 } }] } });
    expect((await loadMappings()).size).toBe(0);
  });

  it('ignores an object whose key does not match its content', async () => {
    mockExecute.mockResolvedValue({ body: { results: [{ ...smsObject, key: 'order-confirmation-email' }] } });
    expect((await loadMappings()).size).toBe(0);
  });

  it('returns an empty map for an empty container', async () => {
    mockExecute.mockResolvedValue({ body: { results: [] } });
    expect((await loadMappings()).size).toBe(0);
  });
});
