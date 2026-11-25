import { validateProviders } from '../../src/connector/validate-providers';
import type { ChannelConfiguration } from '../../src/utils/config.utils';

const mockRequest = jest.fn();
const mockFetchAccount = jest.fn();
const mockFetchService = jest.fn();

jest.mock('@sendgrid/client', () => ({
  __esModule: true,
  default: {
    setApiKey: jest.fn(),
    request: (...args: unknown[]) => mockRequest(...args),
  },
}));

jest.mock('twilio', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    api: { v2010: { accounts: () => ({ fetch: (...args: unknown[]) => mockFetchAccount(...args) }) } },
    messaging: { v1: { services: () => ({ fetch: (...args: unknown[]) => mockFetchService(...args) }) } },
  })),
}));

const emailChannel = {
  apiKey: 'SG.secret-key',
  from: 'shop@example.com',
  dataResidency: 'global' as const,
};
const smsChannel = {
  accountSid: 'AC' + 'a'.repeat(32),
  apiKeySid: 'SK' + 'b'.repeat(32),
  apiKeySecret: 'secret',
  messagingServiceSid: 'MG' + 'c'.repeat(32),
  templates: { apiKey: 'SG.secret-key', dataResidency: 'global' as const },
};

const config = (overrides: Partial<ChannelConfiguration> = {}): ChannelConfiguration => ({
  defaultLocale: 'en-US',
  ...overrides,
});

describe('validateProviders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('skips channels that are not configured', async () => {
    await validateProviders(config({}));
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it('checks the SendGrid key for templates.read when SMS is enabled', async () => {
    mockFetchAccount.mockResolvedValue({});
    mockFetchService.mockResolvedValue({});
    mockRequest.mockResolvedValue([{ statusCode: 200 }, { scopes: ['templates.read'] }]);
    await expect(validateProviders(config({ sms: smsChannel }))).resolves.toBeUndefined();
    mockRequest.mockResolvedValue([{ statusCode: 200 }, { scopes: ['mail.send'] }]);
    await expect(validateProviders(config({ sms: smsChannel }))).rejects.toThrow(
      'SendGrid API key does not include the templates.read permission'
    );
  });

  it('requires both scopes when both channels are enabled', async () => {
    mockFetchAccount.mockResolvedValue({});
    mockFetchService.mockResolvedValue({});
    mockRequest.mockResolvedValue([{ statusCode: 200 }, { scopes: ['mail.send'] }]);
    await expect(validateProviders(config({ email: emailChannel, sms: smsChannel }))).rejects.toThrow(
      'templates.read'
    );
  });

  it('accepts a SendGrid key with mail.send', async () => {
    mockRequest.mockResolvedValue([{ statusCode: 200 }, { scopes: ['mail.send', 'alerts.read'] }]);
    await expect(validateProviders(config({ email: emailChannel }))).resolves.toBeUndefined();
  });

  it('fails on a SendGrid 401 without printing the key', async () => {
    mockRequest.mockResolvedValue([{ statusCode: 401 }, {}]);
    const error = (await validateProviders(config({ email: emailChannel })).catch((e: unknown) => e)) as Error;
    expect(error.message).toBe('SendGrid credential check failed (HTTP 401)');
    expect(error.message).not.toContain('secret-key');
  });

  it('fails when the SendGrid key lacks mail.send', async () => {
    mockRequest.mockResolvedValue([{ statusCode: 200 }, { scopes: ['alerts.read'] }]);
    await expect(validateProviders(config({ email: emailChannel }))).rejects.toThrow(
      'SendGrid API key does not include the mail.send permission'
    );
  });

  it('checks the Twilio account and the Messaging Service', async () => {
    mockFetchAccount.mockResolvedValue({});
    mockFetchService.mockResolvedValue({});
    mockRequest.mockResolvedValue([{ statusCode: 200 }, { scopes: ['templates.read'] }]);
    await validateProviders(config({ sms: smsChannel }));
    expect(mockFetchAccount).toHaveBeenCalled();
    expect(mockFetchService).toHaveBeenCalled();
  });

  it('fails on a Twilio 401', async () => {
    mockRequest.mockResolvedValue([{ statusCode: 200 }, { scopes: ['templates.read'] }]);
    mockFetchAccount.mockRejectedValue(Object.assign(new Error('auth'), { status: 401 }));
    await expect(validateProviders(config({ sms: { ...smsChannel, messagingServiceSid: undefined } }))).rejects.toThrow(
      'Twilio credential check failed (HTTP 401)'
    );
  });
});
