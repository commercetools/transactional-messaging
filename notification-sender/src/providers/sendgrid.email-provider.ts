import { Client } from '@sendgrid/client';
import { MailService } from '@sendgrid/mail';
import { DeliveryError, type EmailProvider } from './types';
import { withTimeout } from './timeout';

export type SendGridOptions = {
  apiKey: string;
  from: string;
  dataResidency: 'global' | 'eu';
  timeoutMs: number;
};

export const toSendGridError = (error: unknown): DeliveryError => {
  // SendGrid ResponseError: `code` is the HTTP status.
  const status = (error as { code?: unknown })?.code;
  if (typeof status !== 'number') {
    return new DeliveryError('SendGrid request failed', 'transient', 'sendgrid');
  }
  const kind = status === 429 || status >= 500 ? 'transient' : 'permanent';
  return new DeliveryError(`SendGrid responded ${status}`, kind, 'sendgrid', status);
};

export const createSendGridEmailProvider = ({
  apiKey,
  from,
  dataResidency,
  timeoutMs,
}: SendGridOptions): EmailProvider => {
  // A dedicated client keeps the API key and data residency out of the global singleton.
  const client = new Client();
  client.setApiKey(apiKey);
  if (dataResidency === 'eu') client.setDataResidency('eu');
  const mail = new MailService();
  mail.setClient(client);

  return {
    async send({ to, templateId, data, correlation }) {
      try {
        await withTimeout(
          mail.send({
            from,
            templateId,
            personalizations: [{ to, dynamicTemplateData: data }],
            // String values only; visible in SendGrid's event webhook.
            customArgs: {
              ct_message_id: correlation.messageId,
              ct_resource_id: correlation.resourceId,
              notification: correlation.notification,
            },
          }),
          timeoutMs,
          () => new DeliveryError('SendGrid request timed out', 'transient', 'sendgrid')
        );
      } catch (error) {
        if (error instanceof DeliveryError) throw error;
        throw toSendGridError(error);
      }
    },
  };
};
