import { parseNotificationMapping } from '../../shared/mappings/notification-mapping';
import {
  buildMappingValue,
  emptyFormValues,
  hasFormErrors,
  validateMappingForm,
  type MappingFormValues,
} from './mapping-helpers';

const TEMPLATE_ID = 'd-0123456789abcdef0123456789abcdef';

const values = (
  overrides: Partial<MappingFormValues> = {}
): MappingFormValues => ({
  ...emptyFormValues(),
  notification: 'order-confirmation',
  channel: 'email',
  enabled: true,
  templateId: TEMPLATE_ID,
  ...overrides,
});

describe('validateMappingForm', () => {
  it('accepts a valid template ID for email and SMS', () => {
    expect(hasFormErrors(validateMappingForm(values()))).toBe(false);
    expect(hasFormErrors(validateMappingForm(values({ channel: 'sms' })))).toBe(
      false
    );
  });

  it('requires a notification', () => {
    expect(validateMappingForm(values({ notification: '' })).notification).toBe(
      'required'
    );
  });

  it('rejects an invalid or empty template ID', () => {
    expect(validateMappingForm(values({ templateId: 'x' })).templateId).toBe(
      'invalidSendGridId'
    );
    expect(validateMappingForm(values({ templateId: '  ' })).templateId).toBe(
      'required'
    );
  });

  it('blocks a duplicate when creating, but not when editing', () => {
    const existing = ['order-confirmation-email'];
    expect(validateMappingForm(values(), existing).notification).toBe(
      'duplicate'
    );
    expect(hasFormErrors(validateMappingForm(values(), []))).toBe(false);
    expect(
      validateMappingForm(values({ channel: 'sms' }), existing).notification
    ).toBeUndefined();
  });
});

describe('buildMappingValue', () => {
  it.each(['email', 'sms'] as const)(
    'builds a %s value that the connector parser accepts',
    (channel) => {
      const value = buildMappingValue(values({ channel }));
      expect(value).toEqual({
        schemaVersion: 2,
        notification: 'order-confirmation',
        channel,
        enabled: true,
        templateId: TEMPLATE_ID,
      });
      expect(parseNotificationMapping(value)).toEqual(value);
    }
  );

  it('trims the template ID', () => {
    expect(
      buildMappingValue(values({ templateId: ` ${TEMPLATE_ID} ` })).templateId
    ).toBe(TEMPLATE_ID);
  });

  it('throws when no notification is selected', () => {
    expect(() => buildMappingValue(values({ notification: '' }))).toThrow(
      'A notification must be selected.'
    );
  });
});
