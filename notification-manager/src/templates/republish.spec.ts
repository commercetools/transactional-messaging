/**
 * @jest-environment jsdom
 */
import type { TemplateDetail, TemplateInput } from '../api/template-api';
import { loadMjml } from './preview';
import type { TemplatePart } from './parts';
import { republishTemplates } from './republish';

const footer: TemplatePart = {
  schemaVersion: 1,
  key: 'footer',
  name: 'Footer',
  notification: 'order-confirmation',
  mjml: '<mj-section><mj-column><mj-text>New footer</mj-text></mj-column></mj-section>',
};

describe('republishTemplates', () => {
  it('compiles each template with the current part and keeps its name and subject', async () => {
    const updates: Array<[string, TemplateInput]> = [];
    const api = {
      get: async (id: string) =>
        ({
          id,
          name: 'Order confirmation',
          subject: 'Order {{orderNumber}}',
          channel: 'email',
          html: '',
          text: '',
          updatedAt: '',
        } as TemplateDetail),
      update: async (id: string, input: TemplateInput) => {
        updates.push([id, input]);
        return {} as TemplateDetail;
      },
    };
    const result = await republishTemplates({
      ids: ['d-1', 'd-2'],
      mjmlById: new Map([
        [
          'd-1',
          '<mjml><mj-body><mj-include path="footer.mjml" /></mj-body></mjml>',
        ],
        [
          'd-2',
          '<mjml><mj-body><mj-include path="gone.mjml" /></mj-body></mjml>',
        ],
      ]),
      parts: [footer],
      api,
      compile: await loadMjml(),
    });

    expect(result.updated).toEqual(['d-1']);
    expect(result.failed).toEqual([
      { id: 'd-2', message: 'There is no part "gone".' },
    ]);
    expect(updates).toHaveLength(1);
    expect(updates[0][1]).toMatchObject({
      channel: 'email',
      name: 'Order confirmation',
      subject: 'Order {{orderNumber}}',
    });
    expect(updates[0][1].html).toContain('New footer');
  });
});
