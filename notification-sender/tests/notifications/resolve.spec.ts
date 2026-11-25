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

describe('resolveEmailTemplate', () => {
  it('uses an enabled merchant template', () => {
    expect(
      resolveEmailTemplate('order-confirmation', templatesWith(['order-confirmation-email', emailTemplate(true)]))
    ).toEqual({ type: 'template', sendGridTemplateId: 'd-merchant' });
  });

  it('sends nothing when the merchant disabled the email', () => {
    expect(
      resolveEmailTemplate('order-confirmation', templatesWith(['order-confirmation-email', emailTemplate(false)]))
    ).toEqual({ type: 'skip', reason: 'disabled' });
  });

  it('sends nothing when there is no mapping', () => {
    expect(resolveEmailTemplate('order-confirmation', new Map())).toEqual({
      type: 'skip',
      reason: 'no-template',
    });
  });
});
