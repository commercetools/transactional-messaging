import { renderSms, validateSmsTemplate } from '../../src/sms/render-sms';

describe('renderSms', () => {
  it('replaces variables', () => {
    expect(renderSms('Hi {{customerFirstName}}, order {{orderNumber}}.', { customerFirstName: 'Jane', orderNumber: '1001' })).toBe(
      'Hi Jane, order 1001.'
    );
  });

  it('renders each and if blocks', () => {
    const source = '{{#each orderLineItems}}{{productName}} x{{productQuantity}} {{/each}}{{#if orderTotalPrice}}Total {{orderTotalPrice}}{{/if}}';
    expect(
      renderSms(source, {
        orderLineItems: [{ productName: 'Shirt', productQuantity: 2 }, { productName: 'Cap', productQuantity: 1 }],
        orderTotalPrice: '€49.90',
      })
    ).toBe('Shirt x2 Cap x1 Total €49.90');
  });

  it('does not HTML-escape ampersands', () => {
    expect(renderSms('{{brand}}', { brand: 'Tom & Jerry' })).toBe('Tom & Jerry');
  });

  it('renders a missing variable as empty', () => {
    expect(renderSms('Hi {{missing}}!', {})).toBe('Hi !');
  });

  it('collapses runs of spaces and trims', () => {
    expect(renderSms('  Hello    world  ', {})).toBe('Hello world');
  });

  it('reports an invalid template from validateSmsTemplate', () => {
    expect(validateSmsTemplate('Hi {{#if x}}')).toEqual(expect.any(String));
    expect(validateSmsTemplate('Hi {{name}}')).toBeUndefined();
  });
});
