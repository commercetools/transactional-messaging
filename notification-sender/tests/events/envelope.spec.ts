import { decodeEnvelope, InvalidEnvelopeError } from '../../src/events/envelope';
import { baseMessage, pubSubBody } from '../helpers';

describe('decodeEnvelope', () => {
  it('decodes a valid Message delivery', () => {
    const message = decodeEnvelope(pubSubBody(baseMessage()));
    expect(message.type).toBe('OrderCreated');
    expect(message.resource.id).toBe('order-1');
  });

  it.each([
    ['no body', undefined],
    ['no message', {}],
    ['missing data', { message: {} }],
    ['empty data', { message: { data: '' } }],
    ['data is not base64 JSON', { message: { data: Buffer.from('not json').toString('base64') } }],
    ['JSON null', { message: { data: Buffer.from('null').toString('base64') } }],
    ['missing resource id', pubSubBody(baseMessage({ resource: { typeId: 'order' } }))],
  ])('rejects %s', (_label, body) => {
    expect(() => decodeEnvelope(body)).toThrow(InvalidEnvelopeError);
  });

  it('rejects the Subscription test delivery, which is not a Message', () => {
    const testDelivery = pubSubBody({
      notificationType: 'ResourceCreated',
      projectKey: 'test-project',
      resource: { typeId: 'subscription', id: 'sub-1' },
      version: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    expect(() => decodeEnvelope(testDelivery)).toThrow(InvalidEnvelopeError);
  });
});
