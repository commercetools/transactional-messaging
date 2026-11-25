import type { NotificationKey } from './keys';
import { mappingKey, type NotificationMapping } from '../mappings/notification-mapping';

export type EmailResolution =
  | { type: 'template'; sendGridTemplateId: string }
  | { type: 'skip'; reason: 'disabled' | 'no-template' };

/**
 * Email rules (plan §7.5):
 *  Merchant template exists and enabled  → send with its SendGrid template id
 *  Merchant template exists and disabled → no email
 *  No merchant template                  → no email
 */
export const resolveEmailTemplate = (
  notification: NotificationKey,
  templates: ReadonlyMap<string, NotificationMapping>
): EmailResolution => {
  const template = templates.get(mappingKey(notification, 'email'));
  if (template) {
    if (!template.enabled) return { type: 'skip', reason: 'disabled' };
    return { type: 'template', sendGridTemplateId: template.templateId };
  }
  return { type: 'skip', reason: 'no-template' };
};
