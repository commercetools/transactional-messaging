import type { NotificationKey } from '../notifications/keys';

export type FailureKind = 'transient' | 'permanent';

/** Thrown by providers. The message never contains recipients, bodies or response bodies. */
export class DeliveryError extends Error {
  constructor(
    message: string,
    readonly kind: FailureKind,
    readonly provider: 'sendgrid' | 'twilio',
    readonly providerCode?: string | number
  ) {
    super(message);
    this.name = 'DeliveryError';
  }
}

/** Identifiers only. This object is logged. */
export type Correlation = { messageId: string; resourceId: string; notification: NotificationKey };

export interface EmailProvider {
  send(input: {
    to: string[];
    templateId: string;
    data: Record<string, unknown>;
    correlation: Correlation;
  }): Promise<void>;
}

export interface SmsProvider {
  /** `to` must already be E.164. */
  send(input: { to: string; body: string; correlation: Correlation }): Promise<{ sid: string }>;
}

/** Reads the text of an SMS template (a SendGrid dynamic template). Throws a DeliveryError when it cannot. */
export interface SmsTemplateSource {
  fetch(templateId: string): Promise<string>;
}
