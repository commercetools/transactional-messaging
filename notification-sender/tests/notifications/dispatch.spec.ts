import { decideAck, dispatchNotification, type DispatchDependencies } from '../../src/notifications/dispatch';
import type { NotificationContext } from '../../src/notifications/context';
import { DeliveryError } from '../../src/providers/types';
import type { NotificationMapping } from '../../src/mappings/notification-mapping';
import { SMS_MAX_LENGTH } from '../../src/sms/render-sms';

jest.mock('../../src/utils/logger.utils', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const emailTemplate: NotificationMapping = {
  schemaVersion: 2,
  notification: 'order-confirmation',
  channel: 'email',
  enabled: true,
  templateId: 'd-merchant',
};
const SMS_TEMPLATE_ID = 'd-0123456789abcdef0123456789abcdef';
const smsTemplate = (enabled = true): NotificationMapping => ({
  schemaVersion: 2,
  notification: 'order-confirmation',
  channel: 'sms',
  enabled,
  templateId: SMS_TEMPLATE_ID,
});

const context = (overrides: Partial<NotificationContext> = {}): NotificationContext => ({
  notification: 'order-confirmation',
  locale: 'en-US',
  templateData: { customerFirstName: 'Jane', orderNumber: '1001' },
  recipients: { email: 'jane@example.com', phone: '+491761234567' },
  ...overrides,
});

const emailSend = jest.fn();
const smsSend = jest.fn();
const smsFetch = jest.fn();

const deps = (overrides: Partial<DispatchDependencies> = {}): DispatchDependencies => ({
  templates: new Map([
    ['order-confirmation-email', emailTemplate],
    ['order-confirmation-sms', smsTemplate()],
  ]),
  providers: { email: { send: emailSend }, sms: { send: smsSend }, smsTemplates: { fetch: smsFetch } },
  channels: {
    defaultLocale: 'en-US',
    email: { apiKey: 'SG.x', from: 'shop@example.com', dataResidency: 'global', fallbackTemplateIds: {} },
    sms: {
      accountSid: 'AC',
      apiKeySid: 'SK',
      apiKeySecret: 's',
      fromNumber: '+15551234567',
      templates: { apiKey: 'SG.x', dataResidency: 'global' },
    },
  },
  messageId: 'msg-1',
  resourceId: 'order-1',
  ...overrides,
});

describe('dispatchNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    emailSend.mockResolvedValue(undefined);
    smsSend.mockResolvedValue({ sid: 'SM1' });
    smsFetch.mockResolvedValue('Hi {{customerFirstName}}, order {{orderNumber}}.');
  });

  it('sends one email and one SMS when both templates are enabled', async () => {
    const outcomes = await dispatchNotification(context(), deps());

    expect(emailSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['jane@example.com'],
        templateId: 'd-merchant',
        data: expect.objectContaining({ orderNumber: '1001' }),
      })
    );
    expect(smsFetch).toHaveBeenCalledWith(SMS_TEMPLATE_ID);
    expect(smsSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: '+491761234567', body: 'Hi Jane, order 1001.' })
    );
    expect(outcomes).toEqual([
      { channel: 'email', status: 'sent' },
      { channel: 'sms', status: 'sent', providerId: 'SM1' },
    ]);
    expect(decideAck(outcomes)).toBe(204);
  });

  it('passes messages (localized texts) to both channels', async () => {
    await dispatchNotification(context(), deps({ messages: { welcome: 'Welcome' } }));
    expect(emailSend.mock.calls[0][0].data.messages).toEqual({ welcome: 'Welcome' });
  });

  it('sends the SMS only when the SMS template is the only enabled one', async () => {
    const outcomes = await dispatchNotification(
      context(),
      deps({ templates: new Map([['order-confirmation-sms', smsTemplate()]]) })
    );
    expect(emailSend).not.toHaveBeenCalled();
    expect(outcomes[0]).toEqual({ channel: 'email', status: 'skipped', reason: 'no-template' });
    expect(outcomes[1]).toMatchObject({ channel: 'sms', status: 'sent' });
  });

  it('skips the SMS when the template is disabled and sends the email', async () => {
    const outcomes = await dispatchNotification(
      context(),
      deps({ templates: new Map([['order-confirmation-email', emailTemplate], ['order-confirmation-sms', smsTemplate(false)]]) })
    );
    expect(smsSend).not.toHaveBeenCalled();
    expect(outcomes[1]).toEqual({ channel: 'sms', status: 'skipped', reason: 'disabled' });
  });

  it('email sent + SMS transient failure → 204 and the SMS is not retried', async () => {
    smsSend.mockRejectedValue(new DeliveryError('Twilio responded 503', 'transient', 'twilio', 20429));
    const outcomes = await dispatchNotification(context(), deps());
    expect(outcomes[0]).toEqual({ channel: 'email', status: 'sent' });
    expect(outcomes[1]).toEqual({ channel: 'sms', status: 'failed', kind: 'transient', reason: 'Twilio responded 503' });
    expect(decideAck(outcomes)).toBe(204);
  });

  it('both transient → 503 so the broker redelivers', async () => {
    emailSend.mockRejectedValue(new DeliveryError('SendGrid responded 429', 'transient', 'sendgrid', 429));
    smsSend.mockRejectedValue(new DeliveryError('Twilio responded 500', 'transient', 'twilio', undefined));
    const outcomes = await dispatchNotification(context(), deps());
    expect(decideAck(outcomes)).toBe(503);
  });

  it('email permanent + SMS skipped → 204', async () => {
    emailSend.mockRejectedValue(new DeliveryError('SendGrid responded 400', 'permanent', 'sendgrid', 400));
    const outcomes = await dispatchNotification(
      context({ recipients: { email: 'jane@example.com' } }),
      deps()
    );
    expect(outcomes[0]).toMatchObject({ status: 'failed', kind: 'permanent' });
    expect(outcomes[1]).toEqual({ channel: 'sms', status: 'skipped', reason: 'no-recipient' });
    expect(decideAck(outcomes)).toBe(204);
  });

  it('an unknown error with no status is transient and does not stop the other channel', async () => {
    emailSend.mockRejectedValue(new Error('socket hang up'));
    const outcomes = await dispatchNotification(context(), deps());
    expect(outcomes[0]).toEqual({ channel: 'email', status: 'failed', kind: 'transient', reason: 'unexpected-error' });
    expect(outcomes[1]).toMatchObject({ channel: 'sms', status: 'sent' });
  });

  it('skips the SMS without consent when a consent field is configured', async () => {
    const outcomes = await dispatchNotification(
      context(),
      deps({ channels: { ...deps().channels, sms: { ...deps().channels.sms!, consentCustomField: 'smsConsent' } } })
    );
    expect(smsSend).not.toHaveBeenCalled();
    expect(outcomes[1]).toEqual({ channel: 'sms', status: 'skipped', reason: 'no-consent' });
  });

  it('renders messages.* in the SMS text', async () => {
    smsFetch.mockResolvedValue('{{messages.welcome}} {{customerFirstName}}');
    await dispatchNotification(context(), deps({ messages: { welcome: 'Hallo' } }));
    expect(smsSend.mock.calls[0][0].body).toBe('Hallo Jane');
  });

  it('a transient failure to read the SMS template is a transient SMS failure and the email still goes out', async () => {
    smsFetch.mockRejectedValue(new DeliveryError('SendGrid responded 503', 'transient', 'sendgrid', 503));
    const outcomes = await dispatchNotification(context(), deps());
    expect(outcomes[0]).toMatchObject({ channel: 'email', status: 'sent' });
    expect(outcomes[1]).toEqual({
      channel: 'sms',
      status: 'failed',
      kind: 'transient',
      reason: 'SendGrid responded 503',
    });
    expect(smsSend).not.toHaveBeenCalled();
    expect(decideAck(outcomes)).toBe(204);
  });

  it('a deleted SMS template is a permanent failure', async () => {
    smsFetch.mockRejectedValue(new DeliveryError('SendGrid responded 404', 'permanent', 'sendgrid', 404));
    const outcomes = await dispatchNotification(context({ recipients: { phone: '+491761234567' } }), deps());
    expect(outcomes[1]).toMatchObject({ channel: 'sms', status: 'failed', kind: 'permanent' });
    expect(decideAck(outcomes)).toBe(204);
  });

  it('marks a template that fails to render as a permanent SMS failure only', async () => {
    smsFetch.mockResolvedValue('{{#if x}}');
    const outcomes = await dispatchNotification(context(), deps());
    expect(outcomes[1]).toEqual({ channel: 'sms', status: 'failed', kind: 'permanent', reason: 'template-render-failed' });
    expect(smsSend).not.toHaveBeenCalled();
  });

  it('truncates a long SMS body at the Twilio limit', async () => {
    const long = 'x'.repeat(SMS_MAX_LENGTH + 500);
    smsFetch.mockResolvedValue(long);
    await dispatchNotification(context(), deps());
    expect(smsSend.mock.calls[0][0].body).toHaveLength(SMS_MAX_LENGTH);
  });

  it('uses the legacy env template when no merchant email template exists', async () => {
    await dispatchNotification(
      context(),
      deps({
        templates: new Map(),
        channels: { ...deps().channels, email: { ...deps().channels.email!, fallbackTemplateIds: { 'order-confirmation': 'd-legacy' } } },
      })
    );
    expect(emailSend.mock.calls[0][0].templateId).toBe('d-legacy');
  });
});

describe('decideAck', () => {
  it('acknowledges when nothing needed sending', () => {
    expect(decideAck([{ channel: 'email', status: 'skipped', reason: 'no-template' }])).toBe(204);
  });
});
