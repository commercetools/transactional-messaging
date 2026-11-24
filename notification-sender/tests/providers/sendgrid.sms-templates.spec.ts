import { createSendGridSmsTemplateSource } from '../../src/providers/sendgrid.sms-templates';

const mockRequest = jest.fn();
const mockSetResidency = jest.fn();

jest.mock('@sendgrid/client', () => ({
  Client: jest.fn().mockImplementation(() => ({
    setApiKey: jest.fn(),
    setDataResidency: (...args: unknown[]) => mockSetResidency(...args),
    request: (...args: unknown[]) => mockRequest(...args),
  })),
}));

const ID = 'd-0123456789abcdef0123456789abcdef';
const template = (plain: string | undefined, html: string | undefined = plain) => [
  { statusCode: 200 },
  { name: '[SMS] Order', versions: [{ active: 0, plain_content: 'old' }, { active: 1, plain_content: plain, html_content: html }] },
];

describe('SendGrid SMS template source', () => {
  let clock = 0;
  const source = (ttlMs = 1000) =>
    createSendGridSmsTemplateSource({ apiKey: 'SG.k', dataResidency: 'global', timeoutMs: 1000, ttlMs, now: () => clock });

  beforeEach(() => {
    jest.clearAllMocks();
    clock = 0;
  });

  it('reads the active version text', async () => {
    mockRequest.mockResolvedValue(template('Order {{orderNumber}}'));
    await expect(source().fetch(ID)).resolves.toBe('Order {{orderNumber}}');
    expect(mockRequest).toHaveBeenCalledWith({ method: 'GET', url: `v3/templates/${ID}` });
  });

  it('uses the EU endpoint when configured', async () => {
    createSendGridSmsTemplateSource({ apiKey: 'SG.k', dataResidency: 'eu', timeoutMs: 1000 });
    expect(mockSetResidency).toHaveBeenCalledWith('eu');
  });

  it('falls back to html_content when plain_content is missing', async () => {
    mockRequest.mockResolvedValue(template(undefined, 'From html'));
    await expect(source().fetch(ID)).resolves.toBe('From html');
  });

  it('reuses a fresh copy and refetches after the ttl', async () => {
    mockRequest.mockResolvedValueOnce(template('one')).mockResolvedValueOnce(template('two'));
    const s = source(1000);
    await expect(s.fetch(ID)).resolves.toBe('one');
    clock = 500;
    await expect(s.fetch(ID)).resolves.toBe('one');
    expect(mockRequest).toHaveBeenCalledTimes(1);
    clock = 1500;
    await expect(s.fetch(ID)).resolves.toBe('two');
  });

  it('serves a stale copy when SendGrid fails transiently', async () => {
    mockRequest.mockResolvedValueOnce(template('cached')).mockRejectedValueOnce({ code: 503 });
    const s = source(1000);
    await s.fetch(ID);
    clock = 5000;
    await expect(s.fetch(ID)).resolves.toBe('cached');
  });

  it('fails transiently when there is nothing cached', async () => {
    mockRequest.mockRejectedValue({ code: 503 });
    await expect(source().fetch(ID)).rejects.toMatchObject({ kind: 'transient' });
  });

  it('fails permanently for a missing template, even when a copy is cached', async () => {
    mockRequest.mockResolvedValueOnce(template('cached')).mockRejectedValueOnce({ code: 404 });
    const s = source(1000);
    await s.fetch(ID);
    clock = 5000;
    await expect(s.fetch(ID)).rejects.toMatchObject({ kind: 'permanent' });
  });

  it('refuses a template that is not an SMS template', async () => {
    mockRequest.mockResolvedValue([
      { statusCode: 200 },
      { name: 'Order confirmation', versions: [{ active: 1, plain_content: 'Email text' }] },
    ]);
    await expect(source().fetch(ID)).rejects.toMatchObject({ kind: 'permanent' });
  });

  it('fails permanently for an empty template', async () => {
    mockRequest.mockResolvedValue(template('   '));
    await expect(source().fetch(ID)).rejects.toMatchObject({ kind: 'permanent' });
  });
});
