import CustomError from '../../src/errors/custom.error';
import { readChannelConfiguration } from '../../src/utils/config.utils';

const SID_AC = 'AC' + 'a'.repeat(32);
const SID_SK = 'SK' + 'b'.repeat(32);
const SID_MG = 'MG' + 'c'.repeat(32);

const email = { SENDGRID_API_KEY: 'SG.key', SENDER_EMAIL_ADDRESS: 'shop@example.com' };
const sms = {
  SENDGRID_API_KEY: 'SG.key',
  TWILIO_ACCOUNT_SID: SID_AC,
  TWILIO_API_KEY_SID: SID_SK,
  TWILIO_API_KEY_SECRET: 'secret',
  TWILIO_FROM_NUMBER: '+15551234567',
};
const base = { DEFAULT_LOCALE: 'en-US' };

const problemsOf = (env: NodeJS.ProcessEnv): string[] => {
  try {
    readChannelConfiguration(env);
  } catch (error) {
    expect(error).toBeInstanceOf(CustomError);
    return (error as CustomError).errors?.map((e) => e.message) ?? [];
  }
  throw new Error('expected a configuration error');
};

describe('readChannelConfiguration', () => {
  it('enables email only when its two keys are set', () => {
    const config = readChannelConfiguration({ ...base, ...email });
    expect(config.email).toEqual({
      apiKey: 'SG.key',
      from: 'shop@example.com',
      dataResidency: 'global',
      fallbackTemplateIds: {},
    });
    expect(config.sms).toBeUndefined();
  });

  it('enables SMS only, with the Messaging Service preferred when set', () => {
    const config = readChannelConfiguration({ ...base, ...sms, TWILIO_MESSAGING_SERVICE_SID: SID_MG });
    expect(config.email).toBeUndefined();
    expect(config.sms).toMatchObject({ accountSid: SID_AC, messagingServiceSid: SID_MG, fromNumber: '+15551234567' });
  });

  it('requires a SendGrid key for SMS, whose texts are SendGrid templates', () => {
    const { SENDGRID_API_KEY: _omit, ...smsWithoutKey } = sms;
    expect(problemsOf({ ...base, ...smsWithoutKey })).toContain(
      'SENDGRID_API_KEY is required for the SMS channel, because SMS templates are read from SendGrid'
    );
  });

  it('gives SMS its own SendGrid template settings, without enabling email', () => {
    const config = readChannelConfiguration({ ...base, ...sms, SENDGRID_DATA_RESIDENCY: 'eu' });
    expect(config.email).toBeUndefined();
    expect(config.sms?.templates).toEqual({ apiKey: 'SG.key', dataResidency: 'eu' });
  });

  it('enables both channels together', () => {
    const config = readChannelConfiguration({ ...base, ...email, ...sms });
    expect(config.email).toBeDefined();
    expect(config.sms).toBeDefined();
  });

  it('refuses to start with no channel', () => {
    expect(problemsOf({ ...base })).toEqual([
      expect.stringContaining('At least one channel must be configured'),
    ]);
  });

  it('names the missing key when only one email key is set', () => {
    expect(problemsOf({ ...base, SENDGRID_API_KEY: 'SG.key' })).toContain(
      'Email channel is incomplete, missing SENDER_EMAIL_ADDRESS'
    );
    expect(problemsOf({ ...base, SENDER_EMAIL_ADDRESS: 'shop@example.com' })).toContain(
      'Email channel is incomplete, missing SENDGRID_API_KEY'
    );
  });

  it('names the missing SMS keys when the SMS channel is partly set', () => {
    const problems = problemsOf({ ...base, ...email, TWILIO_ACCOUNT_SID: SID_AC, TWILIO_FROM_NUMBER: '+15551234567' });
    expect(problems).toContain('SMS channel is incomplete, missing TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET');
  });

  it('requires a sender for SMS: Messaging Service or from number', () => {
    const problems = problemsOf({ ...base, ...email, TWILIO_ACCOUNT_SID: SID_AC, TWILIO_API_KEY_SID: SID_SK, TWILIO_API_KEY_SECRET: 's' });
    expect(problems).toContain('SMS channel is incomplete, missing TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_NUMBER');
  });

  it('requires DEFAULT_LOCALE', () => {
    expect(problemsOf({ ...email })).toContain('DEFAULT_LOCALE is required');
  });

  it('validates formats and names the key, never the value', () => {
    const problems = problemsOf({
      ...base,
      ...sms,
      SENDGRID_API_KEY: 'not-a-key-value',
      SENDER_EMAIL_ADDRESS: 'secret-value-not-email',
      SENDGRID_DATA_RESIDENCY: 'mars',
      TWILIO_ACCOUNT_SID: 'AC-short-secret',
      TWILIO_FROM_NUMBER: '0176 12',
    });
    expect(problems).toEqual(
      expect.arrayContaining([
        'SENDGRID_API_KEY must start with SG.',
        'SENDER_EMAIL_ADDRESS must be an email address',
        'SENDGRID_DATA_RESIDENCY must be global or eu',
        'TWILIO_ACCOUNT_SID must match AC followed by 32 hex characters',
        'TWILIO_FROM_NUMBER must be an E.164 phone number',
      ])
    );
    expect(JSON.stringify(problems)).not.toContain('secret-value');
    expect(JSON.stringify(problems)).not.toContain('AC-short-secret');
  });

  it('reads the EU residency and the legacy template fallbacks', () => {
    const config = readChannelConfiguration({
      ...base,
      ...email,
      SENDGRID_DATA_RESIDENCY: 'eu',
      ORDER_CONFIRMATION_TEMPLATE_ID: 'd-legacy-order',
    });
    expect(config.email?.dataResidency).toBe('eu');
    expect(config.email?.fallbackTemplateIds).toEqual({ 'order-confirmation': 'd-legacy-order' });
  });

  it('reads the optional SMS consent field', () => {
    const config = readChannelConfiguration({ ...base, ...sms, SMS_CONSENT_CUSTOM_FIELD: 'smsConsent' });
    expect(config.sms?.consentCustomField).toBe('smsConsent');
  });
});
