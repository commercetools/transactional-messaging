import type { Channel, NotificationKey } from '../../shared/notifications/keys';
import {
  SMS_MAX_LENGTH,
  validateSmsTemplate,
} from '../../shared/sms/render-sms';
import type { TemplateInput } from '../../api/template-api';
import { parseNotificationMapping } from '../../shared/mappings/notification-mapping';
import { renderHandlebars } from '../../templates/preview';
import { resolveIncludes } from '../../templates/parts';

/** SendGrid allows 100 characters; SMS templates lose 6 to the "[SMS] " prefix the service adds. */
export const NAME_MAX_LENGTH = 94;

/**
 * What the form edits: a sendable template (a channel) or a part. Parts are Merchant Center only, so 'part'
 * stays out of the shared Channel type the sender uses.
 */
export type TemplateKind = Channel | 'part';

export type TemplateFormValues = {
  name: string;
  channel: TemplateKind;
  notification: NotificationKey | '';
  subject: string;
  /** MJML for email and parts, plain text for SMS. Parts leave the subject empty. */
  content: string;
};

export type TemplateErrorCode =
  | 'required'
  | 'nameTooLong'
  | 'invalidTemplate'
  | 'smsTooLong';

export type TemplateFormErrors = {
  name?: TemplateErrorCode;
  notification?: TemplateErrorCode;
  subject?: TemplateErrorCode;
  content?: TemplateErrorCode;
  /** Parser message shown with invalidTemplate. */
  detail?: string;
};

export const emptyFormValues = (): TemplateFormValues => ({
  name: '',
  channel: 'email',
  notification: '',
  subject: '',
  content: '',
});

/**
 * `parts` maps each part key to its MJML. When given, the includes of an email or a part are checked, so a
 * template that names a missing part cannot be saved.
 */
export const validateTemplateForm = (
  values: TemplateFormValues,
  parts?: ReadonlyMap<string, string>,
  root?: string
): TemplateFormErrors => {
  const errors: TemplateFormErrors = {};
  const name = values.name.trim();
  if (!name) errors.name = 'required';
  else if (name.length > NAME_MAX_LENGTH) errors.name = 'nameTooLong';
  if (!values.notification) errors.notification = 'required';

  if (values.channel === 'email') {
    if (!values.subject.trim()) errors.subject = 'required';
    else {
      const problem = renderHandlebars(values.subject, {}).errors[0];
      if (problem) {
        errors.subject = 'invalidTemplate';
        errors.detail = problem;
      }
    }
  }

  if (!values.content.trim()) {
    errors.content = 'required';
  } else if (values.channel === 'sms') {
    const problem = validateSmsTemplate(values.content);
    if (problem) {
      errors.content = 'invalidTemplate';
      errors.detail = problem;
    } else if (values.content.length > SMS_MAX_LENGTH) {
      errors.content = 'smsTooLong';
    }
  } else if (parts) {
    const problem = resolveIncludes(values.content, parts, root).errors[0];
    if (problem) {
      errors.content = 'invalidTemplate';
      errors.detail = problem;
    }
  }
  return errors;
};

export const hasFormErrors = (errors: TemplateFormErrors): boolean =>
  Boolean(
    errors.name || errors.notification || errors.subject || errors.content
  );

/** The body sent to the template service. `html` is the compiled MJML and is ignored for SMS. */
export const buildTemplateInput = (
  values: TemplateFormValues & { channel: Channel },
  html: string
): TemplateInput =>
  values.channel === 'email'
    ? {
        channel: 'email',
        name: values.name.trim(),
        subject: values.subject.trim(),
        html,
        text: '',
      }
    : {
        channel: 'sms',
        name: values.name.trim(),
        subject: '',
        html: '',
        text: values.content,
      };

/** SendGrid template IDs that mappings point to, so a template in use cannot be deleted. */
export const mappedTemplateIds = (
  objects: ReadonlyArray<{ value?: unknown }>
): Set<string> => {
  const ids = new Set<string>();
  for (const object of objects) {
    const mapping = parseNotificationMapping(object.value);
    const id = mapping?.templateId;
    if (id) ids.add(id);
  }
  return ids;
};
