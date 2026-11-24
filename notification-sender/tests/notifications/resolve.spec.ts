import { resolveEmailTemplate } from '../../src/notifications/resolve';
import type { NotificationMapping } from '../../src/mappings/notification-mapping';

const emailTemplate = (enabled: boolean): NotificationMapping => ({
  schemaVersion: 2,
  notification: 'order-confirmation',
  channel: 'email',
  enabled,
  templateId: 'd-merchant',
});

const templatesWith = (...items: Array<[string, NotificationMapping]>) => new Map(items);
const legacy = { 'order-confirmation': 'd-legacy' };

describe('resolveEmailTemplate', () => {
  it('uses an enabled merchant template', () => {
    expect(
      resolveEmailTemplate('order-confirmation', templatesWith(['order-confirmation-email', emailTemplate(true)]), legacy)
    ).toEqual({ type: 'template', sendGridTemplateId: 'd-merchant' });
  });

  it('sends nothing when the merchant disabled the email, even if a legacy id exists', () => {
    expect(
      resolveEmailTemplate('order-confirmation', templatesWith(['order-confirmation-email', emailTemplate(false)]), legacy)
    ).toEqual({ type: 'skip', reason: 'disabled' });
  });

  it('falls back to the legacy env template when no merchant template exists', () => {
    expect(resolveEmailTemplate('order-confirmation', new Map(), legacy)).toEqual({
      type: 'template',
      sendGridTemplateId: 'd-legacy',
    });
  });

  it('sends nothing when neither exists', () => {
    expect(resolveEmailTemplate('order-confirmation', new Map(), {})).toEqual({
      type: 'skip',
      reason: 'no-template',
    });
  });
});
