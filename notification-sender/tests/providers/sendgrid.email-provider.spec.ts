import { createSendGridEmailProvider } from '../../src/providers/sendgrid.email-provider';
import { DeliveryError, type Correlation } from '../../src/providers/types';

const mockSend = jest.fn();
const mockSetResidency = jest.fn();
const mockSetApiKey = jest.fn();

jest.mock('@sendgrid/mail', () => ({
  MailService: jest.fn().mockImplementation(() => ({
    setClient: jest.fn(),
    send: (...args: unknown[]) => mockSend(...args),
  })),
}));
jest.mock('@sendgrid/client', () => ({
  Client: jest.fn().mockImplementation(() => ({
    setApiKey: (...args: unknown[]) => mockSetApiKey(...args),
    setDataResidency: (...args: unknown[]) => mockSetResidency(...args),
  })),
}));

const correlation: Correlation = {
  messageId: 'msg-1',
  resourceId: 'order-1',
  notification: 'order-confirmation',
};

const provider = (dataResidency: 'global' | 'eu' = 'global', timeoutMs = 4000) =>
  createSendGridEmailProvider({ apiKey: 'SG.test', from: 'shop@example.com', dataResidency, timeoutMs });

describe('SendGrid email provider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends the template, recipients, dynamic data and string custom arguments', async () => {
    mockSend.mockResolvedValue([{ statusCode: 202 }, {}]);

    await provider().send({
      to: ['jane@example.com'],
      templateId: 'd-template',
      data: { orderNumber: '1001' },
      correlation,
    });

    expect(mockSend).toHaveBeenCalledWith({
      from: 'shop@example.com',
      templateId: 'd-template',
      personalizations: [{ to: ['jane@example.com'], dynamicTemplateData: { orderNumber: '1001' } }],
      customArgs: {
        ct_message_id: 'msg-1',
        ct_resource_id: 'order-1',
        notification: 'order-confirmation',
      },
    });
    expect(mockSetApiKey).toHaveBeenCalledWith('SG.test');
  });

  it('sets EU data residency only when configured', () => {
    provider('global');
    expect(mockSetResidency).not.toHaveBeenCalled();
    provider('eu');
    expect(mockSetResidency).toHaveBeenCalledWith('eu');
  });

  it('classifies a 400 as permanent', async () => {
    mockSend.mockRejectedValue(Object.assign(new Error('bad request'), { code: 400 }));
    await expect(provider().send({ to: ['a@example.com'], templateId: 't', data: {}, correlation })).rejects.toMatchObject({
      kind: 'permanent',
      providerCode: 400,
    });
  });

  it('classifies a 429 and a 503 as transient', async () => {
    mockSend.mockRejectedValueOnce(Object.assign(new Error('rate'), { code: 429 }));
    await expect(provider().send({ to: ['a@example.com'], templateId: 't', data: {}, correlation })).rejects.toMatchObject({
      kind: 'transient',
    });
    mockSend.mockRejectedValueOnce(Object.assign(new Error('down'), { code: 503 }));
    await expect(provider().send({ to: ['a@example.com'], templateId: 't', data: {}, correlation })).rejects.toMatchObject({
      kind: 'transient',
    });
  });

  it('treats a network error without a status as transient', async () => {
    mockSend.mockRejectedValue(new Error('socket hang up'));
    await expect(provider().send({ to: ['a@example.com'], templateId: 't', data: {}, correlation })).rejects.toMatchObject({
      kind: 'transient',
      provider: 'sendgrid',
    });
  });

  it('times out as a transient error', async () => {
    mockSend.mockReturnValue(new Promise(() => undefined));
    const error = await provider('global', 10)
      .send({ to: ['a@example.com'], templateId: 't', data: {}, correlation })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DeliveryError);
    expect(error).toMatchObject({ kind: 'transient' });
  });

  it('never puts the recipient address in the error message', async () => {
    mockSend.mockRejectedValue(
      Object.assign(new Error('jane@example.com rejected'), { code: 400, response: { body: { to: 'jane@example.com' } } })
    );
    const error = (await provider()
      .send({ to: ['jane@example.com'], templateId: 't', data: {}, correlation })
      .catch((e: unknown) => e)) as Error;
    expect(error.message).not.toContain('jane@example.com');
  });
});
