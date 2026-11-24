import {
  buildTemplateInput,
  emptyFormValues,
  hasFormErrors,
  mappedTemplateIds,
  NAME_MAX_LENGTH,
  validateTemplateForm,
  type TemplateFormValues,
} from './template-helpers';

const email: TemplateFormValues = {
  name: 'Order confirmation',
  channel: 'email',
  notification: 'order-confirmation',
  subject: 'Order {{orderNumber}}',
  content: '<mjml></mjml>',
};

describe('validateTemplateForm', () => {
  it('accepts a complete email and SMS', () => {
    expect(hasFormErrors(validateTemplateForm(email))).toBe(false);
    expect(
      hasFormErrors(
        validateTemplateForm({
          ...email,
          channel: 'sms',
          subject: '',
          content: 'Hi {{customerFirstName}}',
        })
      )
    ).toBe(false);
  });

  it('requires name, notification, subject (email) and content', () => {
    const errors = validateTemplateForm(emptyFormValues());
    expect(errors).toMatchObject({
      name: 'required',
      notification: 'required',
      subject: 'required',
      content: 'required',
    });
  });

  it('does not require a subject for SMS', () => {
    expect(
      validateTemplateForm({
        ...email,
        channel: 'sms',
        subject: '',
        content: 'x',
      }).subject
    ).toBeUndefined();
  });

  it('limits the name length', () => {
    expect(
      validateTemplateForm({ ...email, name: 'x'.repeat(NAME_MAX_LENGTH + 1) })
        .name
    ).toBe('nameTooLong');
  });

  it('reports a broken Handlebars subject or SMS text with the parser message', () => {
    const subject = validateTemplateForm({ ...email, subject: '{{#if}}' });
    expect(subject.subject).toBe('invalidTemplate');
    expect(subject.detail).toBeTruthy();
    expect(
      validateTemplateForm({ ...email, channel: 'sms', content: '{{#each}}' })
        .content
    ).toBe('invalidTemplate');
  });

  it('rejects SMS text beyond the Twilio limit', () => {
    expect(
      validateTemplateForm({
        ...email,
        channel: 'sms',
        content: 'x'.repeat(1601),
      }).content
    ).toBe('smsTooLong');
  });
});

describe('buildTemplateInput', () => {
  it('sends compiled HTML for email', () => {
    expect(buildTemplateInput({ ...email, name: ' A ' }, '<html/>')).toEqual({
      channel: 'email',
      name: 'A',
      subject: 'Order {{orderNumber}}',
      html: '<html/>',
      text: '',
    });
  });

  it('sends the text for SMS', () => {
    expect(
      buildTemplateInput({ ...email, channel: 'sms', content: 'Hi' }, '')
    ).toMatchObject({ channel: 'sms', text: 'Hi', html: '', subject: '' });
  });
});

describe('mappedTemplateIds', () => {
  it('collects the SendGrid IDs of valid mappings and ignores invalid objects', () => {
    const id = `d-${'a'.repeat(32)}`;
    const ids = mappedTemplateIds([
      {
        value: {
          schemaVersion: 2,
          notification: 'order-confirmation',
          channel: 'email',
          enabled: true,
          templateId: id,
        },
      },
      { value: { nonsense: true } },
      { value: undefined },
    ]);
    expect([...ids]).toEqual([id]);
  });
});
