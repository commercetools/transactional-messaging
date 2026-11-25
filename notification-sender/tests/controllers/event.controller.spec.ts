import request from 'supertest';
import app from '../../src/app';
import { baseMessage, pubSubBody } from '../helpers';
import { getOrderById } from '../../src/ctp/order';
import { getCustomerById } from '../../src/ctp/customer';
import { logger } from '../../src/utils/logger.utils';
import { loadMappings } from '../../src/mappings/mapping-store';
import { getProviders } from '../../src/providers';
import { DeliveryError } from '../../src/providers/types';

jest.mock('../../src/utils/logger.utils', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock('../../src/ctp/project', () => ({
  getProject: jest.fn(() => Promise.resolve({ languages: ['en-US'] })),
}));
jest.mock('../../src/ctp/order', () => ({ getOrderById: jest.fn() }));
jest.mock('../../src/ctp/customer', () => ({
  getCustomerById: jest.fn(),
  createTokenForVerification: jest.fn(),
  generatePasswordResetToken: jest.fn(),
}));
jest.mock('../../src/mappings/mapping-store', () => ({ loadMappings: jest.fn() }));
jest.mock('../../src/utils/localization.utils', () => ({
  loadAdditionalLocalizations: jest.fn(() => Promise.resolve(undefined)),
  formatLocalizedString: jest.fn(),
}));
jest.mock('../../src/providers', () => ({ getProviders: jest.fn() }));

const emailSend = jest.fn();
const smsSend = jest.fn();
const smsFetch = jest.fn();

const order = {
  id: 'order-1',
  orderNumber: '1001',
  createdAt: '2026-01-01T00:00:00.000Z',
  customerEmail: 'jane@example.com',
  totalPrice: { type: 'centPrecision', centAmount: 4990, currencyCode: 'EUR', fractionDigits: 2 },
  lineItems: [],
  shippingAddress: { firstName: 'Jane', lastName: 'Doe', country: 'DE', mobile: '+491761234567' },
};

const post = (message: unknown) => request(app).post('/notificationSender').send(pubSubBody(message));

const EMAIL_MAPPING_KEY = 'order-confirmation-email';
const EMAIL_MAPPING = {
  schemaVersion: 2,
  notification: 'order-confirmation',
  channel: 'email',
  enabled: true,
  templateId: 'd-order-confirmation',
};

describe('POST /notificationSender', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    emailSend.mockResolvedValue(undefined);
    smsSend.mockResolvedValue({ sid: 'SM1' });
    smsFetch.mockResolvedValue('Order {{orderNumber}}');
    (getProviders as jest.Mock).mockReturnValue({
      email: { send: emailSend },
      sms: { send: smsSend },
      smsTemplates: { fetch: smsFetch },
    });
    (loadMappings as jest.Mock).mockResolvedValue(new Map([[EMAIL_MAPPING_KEY, EMAIL_MAPPING]]));
    process.env.CTP_CLIENT_ID = 'connector-client';
    process.env.SENDER_EMAIL_ADDRESS = 'shop@example.com';
    process.env.SENDGRID_API_KEY = 'SG.test';
    process.env.DEFAULT_LOCALE = 'en-US';
  });

  it('acknowledges with 204 after sending the email confirmation via its mapping', async () => {
    (getOrderById as jest.Mock).mockResolvedValue(order);

    const response = await post(baseMessage());

    expect(response.status).toBe(204);
    expect(getOrderById).toHaveBeenCalledWith('order-1');
    expect(emailSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['jane@example.com'],
        templateId: 'd-order-confirmation',
        data: expect.objectContaining({ orderNumber: '1001' }),
      })
    );
  });

  it('sends the SMS too when a merchant SMS template is enabled', async () => {
    (getOrderById as jest.Mock).mockResolvedValue(order);
    (loadMappings as jest.Mock).mockResolvedValue(
      new Map([
        [EMAIL_MAPPING_KEY, EMAIL_MAPPING],
        [
          'order-confirmation-sms',
          { schemaVersion: 2, notification: 'order-confirmation', channel: 'sms', enabled: true, templateId: 'd-0123456789abcdef0123456789abcdef' },
        ],
      ])
    );

    const response = await post(baseMessage());

    expect(response.status).toBe(204);
    expect(smsSend).toHaveBeenCalledWith(expect.objectContaining({ to: '+491761234567', body: 'Order 1001' }));
  });

  it('re-fetches the order and never trusts the payload', async () => {
    (getOrderById as jest.Mock).mockResolvedValue(order);
    await post({ ...baseMessage(), order: { id: 'stale', customerEmail: 'other@example.com' } });
    expect(getOrderById).toHaveBeenCalledWith('order-1');
    expect(emailSend.mock.calls[0][0].to).toEqual(['jane@example.com']);
  });

  it('acknowledges with 200 a message type it does not handle', async () => {
    const response = await post(baseMessage({ type: 'ProductCreated', resource: { typeId: 'product', id: 'p-1' } }));
    expect(response.status).toBe(200);
    expect(emailSend).not.toHaveBeenCalled();
  });

  it('acknowledges with 200 an envelope that is not a Message', async () => {
    const response = await request(app)
      .post('/notificationSender')
      .send({ message: { data: Buffer.from('nope').toString('base64') } });
    expect(response.status).toBe(200);
  });

  it('acknowledges with 200 a change made by the connector itself, so no loop forms', async () => {
    const response = await post(baseMessage({ createdBy: { clientId: 'connector-client' } }));
    expect(response.status).toBe(200);
    expect(getOrderById).not.toHaveBeenCalled();
  });

  it('returns 503 on a network error so the broker retries', async () => {
    (getOrderById as jest.Mock).mockRejectedValue(new Error('socket hang up'));
    expect((await post(baseMessage())).status).toBe(503);
  });

  it('returns 503 when the platform answers 503', async () => {
    (getOrderById as jest.Mock).mockRejectedValue(Object.assign(new Error('x'), { statusCode: 503 }));
    expect((await post(baseMessage())).status).toBe(503);
  });

  it('returns 200 when the order no longer exists, because retrying cannot help', async () => {
    (getOrderById as jest.Mock).mockRejectedValue(Object.assign(new Error('not found'), { statusCode: 404 }));
    expect((await post(baseMessage())).status).toBe(200);
  });

  it('returns 503 when SendGrid is rate limiting, and acknowledges a permanent rejection without retrying', async () => {
    (getOrderById as jest.Mock).mockResolvedValue(order);
    emailSend.mockRejectedValueOnce(new DeliveryError('SendGrid responded 429', 'transient', 'sendgrid', 429));
    expect((await post(baseMessage())).status).toBe(503);

    emailSend.mockRejectedValueOnce(new DeliveryError('SendGrid responded 400', 'permanent', 'sendgrid', 400));
    expect((await post(baseMessage())).status).toBe(204);
  });

  it('returns 204 when SMS succeeded even though email failed transiently', async () => {
    (getOrderById as jest.Mock).mockResolvedValue(order);
    (loadMappings as jest.Mock).mockResolvedValue(
      new Map([
        [EMAIL_MAPPING_KEY, EMAIL_MAPPING],
        [
          'order-confirmation-sms',
          { schemaVersion: 2, notification: 'order-confirmation', channel: 'sms', enabled: true, templateId: 'd-0123456789abcdef0123456789abcdef' },
        ],
      ])
    );
    emailSend.mockRejectedValueOnce(new DeliveryError('SendGrid responded 503', 'transient', 'sendgrid', 503));
    expect((await post(baseMessage())).status).toBe(204);
    expect(logger.error).toHaveBeenCalledWith('Notification outcome', expect.objectContaining({ channel: 'email', status: 'failed' }));
  });

  it('never logs the customer email address, phone number or name', async () => {
    (getOrderById as jest.Mock).mockResolvedValue(order);
    (getCustomerById as jest.Mock).mockResolvedValue({ id: 'c-1' });
    await post(baseMessage());
    const logged = JSON.stringify([
      ...(logger.info as jest.Mock).mock.calls,
      ...(logger.error as jest.Mock).mock.calls,
      ...(logger.warn as jest.Mock).mock.calls,
    ]);
    expect(logged).not.toContain('jane@example.com');
    expect(logged).not.toContain('+491761234567');
    expect(logged).not.toContain('Jane');
  });
});

describe('routes', () => {
  it('answers the health check', async () => {
    const response = await request(app).get('/notificationSender/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('answers unknown paths with a generic 404', async () => {
    const response = await request(app).post('/does-not-exist');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Path not found.' });
  });
});
