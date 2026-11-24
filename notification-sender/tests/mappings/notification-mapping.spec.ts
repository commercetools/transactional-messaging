import { parseNotificationMapping, mappingKey } from '../../src/mappings/notification-mapping';

const ID = 'd-0123456789abcdef0123456789abcdef';
const emailValue = {
  schemaVersion: 2,
  notification: 'order-confirmation',
  channel: 'email',
  enabled: true,
  templateId: ID,
};
const smsValue = { ...emailValue, channel: 'sms' };

describe('parseNotificationMapping', () => {
  it('accepts valid email and SMS mappings', () => {
    expect(parseNotificationMapping(emailValue)).toEqual(emailValue);
    expect(parseNotificationMapping(smsValue)).toMatchObject({ channel: 'sms', templateId: ID });
  });

  it('reads a schema 1 email mapping as a schema 2 one', () => {
    expect(
      parseNotificationMapping({
        schemaVersion: 1,
        notification: 'order-confirmation',
        channel: 'email',
        enabled: true,
        email: { sendGridTemplateId: ID },
      })
    ).toEqual(emailValue);
  });

  it('rejects a schema 1 SMS mapping, which held the text and has no template', () => {
    expect(
      parseNotificationMapping({
        schemaVersion: 1,
        notification: 'order-confirmation',
        channel: 'sms',
        enabled: true,
        sms: { body: { 'en-US': 'Hi' } },
      })
    ).toBeUndefined();
  });

  it('rejects other schema versions, unknown notifications and channels', () => {
    expect(parseNotificationMapping({ ...emailValue, schemaVersion: 3 })).toBeUndefined();
    expect(parseNotificationMapping({ ...emailValue, notification: 'unknown' })).toBeUndefined();
    expect(parseNotificationMapping({ ...emailValue, channel: 'push' })).toBeUndefined();
  });

  it('requires a SendGrid dynamic template ID', () => {
    expect(parseNotificationMapping({ ...emailValue, templateId: undefined })).toBeUndefined();
    expect(parseNotificationMapping({ ...emailValue, templateId: 'd-1' })).toBeUndefined();
    expect(parseNotificationMapping({ ...emailValue, templateId: 42 })).toBeUndefined();
  });

  it('requires a boolean enabled flag', () => {
    expect(parseNotificationMapping({ ...emailValue, enabled: 'yes' })).toBeUndefined();
  });

  it('builds the key as notification-channel', () => {
    expect(mappingKey('order-confirmation', 'sms')).toBe('order-confirmation-sms');
  });
});
