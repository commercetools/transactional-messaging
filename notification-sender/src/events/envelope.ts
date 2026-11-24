import type { Message } from '@commercetools/platform-sdk';

export class InvalidEnvelopeError extends Error {}

/**
 * Decodes a Pub/Sub push body: { message: { data: base64(JSON Message) } }.
 * Throws InvalidEnvelopeError for anything that is not a commercetools Message,
 * including the Subscription test delivery (notificationType "ResourceCreated").
 */
export const decodeEnvelope = (body: unknown): Message => {
  const data = (body as { message?: { data?: unknown } } | undefined)?.message?.data;
  if (typeof data !== 'string' || data.length === 0) {
    throw new InvalidEnvelopeError('missing message.data');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(data, 'base64').toString('utf8').trim());
  } catch {
    throw new InvalidEnvelopeError('message.data is not base64-encoded JSON');
  }

  const candidate = parsed as Record<string, unknown> | null;
  const resource = candidate?.resource as { typeId?: unknown; id?: unknown } | undefined;
  if (
    !candidate ||
    candidate.notificationType !== 'Message' ||
    typeof candidate.type !== 'string' ||
    typeof resource?.typeId !== 'string' ||
    typeof resource?.id !== 'string'
  ) {
    throw new InvalidEnvelopeError('not a commercetools Message');
  }
  return candidate as unknown as Message;
};
