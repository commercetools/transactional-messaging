/** Wraps a commercetools Message the way Connect's Pub/Sub push delivers it. */
export const pubSubBody = (message: unknown) => ({
  message: { data: Buffer.from(JSON.stringify(message)).toString('base64') },
});

export const baseMessage = (overrides: Record<string, unknown> = {}) => ({
  notificationType: 'Message',
  projectKey: 'test-project',
  id: '11111111-1111-4111-8111-111111111111',
  version: 1,
  sequenceNumber: 1,
  resource: { typeId: 'order', id: 'order-1' },
  resourceVersion: 1,
  type: 'OrderCreated',
  createdAt: '2026-01-01T00:00:00.000Z',
  lastModifiedAt: '2026-01-01T00:00:00.000Z',
  createdBy: { clientId: 'storefront-client' },
  lastModifiedBy: { clientId: 'storefront-client' },
  ...overrides,
});
