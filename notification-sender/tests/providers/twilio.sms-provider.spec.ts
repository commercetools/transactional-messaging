import { createTwilioSmsProvider } from '../../src/providers/twilio.sms-provider';
import type { Correlation } from '../../src/providers/types';

const mockCreate = jest.fn();

jest.mock('twilio', () => ({
  __esModule: true,
  default: jest.fn(() => ({ messages: { create: (...args: unknown[]) => mockCreate(...args) } })),
}));

const correlation: Correlation = {
  messageId: 'msg-1',
  resourceId: 'order-1',
  notification: 'order-confirmation',
};

const baseOptions = {
  accountSid: 'AC' + 'a'.repeat(32),
  apiKeySid: 'SK' + 'b'.repeat(32),
  apiKeySecret: 'secret',
  timeoutMs: 4000,
};

describe('Twilio SMS provider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends through the Messaging Service when one is configured', async () => {
    mockCreate.mockResolvedValue({ sid: 'SM123' });
    const provider = createTwilioSmsProvider({ ...baseOptions, messagingServiceSid: 'MG' + 'c'.repeat(32) });

    const result = await provider.send({ to: '+4917612345678', body: 'Hi', correlation });

    expect(mockCreate).toHaveBeenCalledWith({
      to: '+4917612345678',
      body: 'Hi',
      messagingServiceSid: 'MG' + 'c'.repeat(32),
    });
    expect(result).toEqual({ sid: 'SM123' });
  });

  it('sends from the fixed number when no Messaging Service is configured', async () => {
    mockCreate.mockResolvedValue({ sid: 'SM456' });
    const provider = createTwilioSmsProvider({ ...baseOptions, fromNumber: '+15551234567' });

    await provider.send({ to: '+4917612345678', body: 'Hi', correlation });

    expect(mockCreate).toHaveBeenCalledWith({ to: '+4917612345678', body: 'Hi', from: '+15551234567' });
  });

  it('classifies status 400 with code 21211 as permanent and keeps the code', async () => {
    mockCreate.mockRejectedValue(Object.assign(new Error('invalid To'), { status: 400, code: 21211 }));
    const provider = createTwilioSmsProvider({ ...baseOptions, fromNumber: '+15551234567' });
    await expect(provider.send({ to: '+1', body: 'x', correlation })).rejects.toMatchObject({
      kind: 'permanent',
      providerCode: 21211,
      message: 'Twilio responded 400 (code 21211)',
    });
  });

  it('classifies status 429 and 500 as transient', async () => {
    const provider = createTwilioSmsProvider({ ...baseOptions, fromNumber: '+15551234567' });
    mockCreate.mockRejectedValueOnce(Object.assign(new Error('rate'), { status: 429 }));
    await expect(provider.send({ to: '+1', body: 'x', correlation })).rejects.toMatchObject({ kind: 'transient' });
    mockCreate.mockRejectedValueOnce(Object.assign(new Error('down'), { status: 500 }));
    await expect(provider.send({ to: '+1', body: 'x', correlation })).rejects.toMatchObject({ kind: 'transient' });
  });

  it('classifies a network error as transient', async () => {
    mockCreate.mockRejectedValue(new Error('ECONNRESET'));
    const provider = createTwilioSmsProvider({ ...baseOptions, fromNumber: '+15551234567' });
    await expect(provider.send({ to: '+1', body: 'x', correlation })).rejects.toMatchObject({
      kind: 'transient',
      provider: 'twilio',
    });
  });
});
