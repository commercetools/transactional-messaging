import type { Message } from '@commercetools/platform-sdk';

/**
 * True when the change was caused by this connector's own API client.
 * Acknowledging these prevents loops, e.g. minting a token emits another token message.
 */
export const isSelfCreated = (message: Message): boolean => {
  const clientId = process.env.CTP_CLIENT_ID;
  const createdBy = message.createdBy?.clientId;
  return Boolean(clientId) && createdBy === clientId;
};
