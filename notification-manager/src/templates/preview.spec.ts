/**
 * @jest-environment jsdom
 */
import { NOTIFICATION_KEYS } from '../shared/notifications/keys';
import { DEFAULT_EMAIL_MJML } from './defaults-email';
import { DEFAULT_SMS_TEXT } from './defaults-sms';
import {
  compileMjml,
  loadMjml,
  previewData,
  renderEmailPreview,
  renderHandlebars,
  renderSmsPreview,
  renderSubject,
} from './preview';

describe('previews', () => {
  it('renders every default email with its own sample data and no leftover variables', async () => {
    const compile = await loadMjml();
    for (const key of NOTIFICATION_KEYS) {
      const { output, errors } = renderEmailPreview(
        compile,
        DEFAULT_EMAIL_MJML[key],
        previewData(key, undefined, 'en-US')
      );
      expect(errors).toEqual([]);
      expect(output).toContain('<html');
      expect(output).not.toMatch(/\{\{/);
    }
  });

  it('puts sample values into the order confirmation', async () => {
    const compile = await loadMjml();
    const data = previewData('order-confirmation', undefined, 'en-US');
    const { output } = renderEmailPreview(
      compile,
      DEFAULT_EMAIL_MJML['order-confirmation'],
      data
    );
    expect(output).toContain(String(data.orderNumber));
  });

  it('renders every default SMS', () => {
    for (const key of NOTIFICATION_KEYS) {
      const { output, errors } = renderSmsPreview(
        DEFAULT_SMS_TEXT[key],
        previewData(key, undefined, 'en-US')
      );
      expect(errors).toEqual([]);
      expect(output).not.toMatch(/\{\{/);
    }
  });

  it('reports Handlebars and MJML problems instead of throwing', async () => {
    expect(renderHandlebars('{{#if}}', {}).errors).toHaveLength(1);
    const compile = await loadMjml();
    expect(
      compileMjml(compile, '<mjml><mj-body></mj-body>').html
    ).toBeDefined();
    expect(renderSubject('Order {{orderNumber}}', { orderNumber: '1' })).toBe(
      'Order 1'
    );
    expect(renderSubject('{{#if}}', {})).toBe('{{#if}}');
  });
});
