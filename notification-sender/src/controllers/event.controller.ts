import type { Request, Response } from 'express';
import type { Message } from '@commercetools/platform-sdk';
import { logger } from '../utils/logger.utils';
import { decodeEnvelope, InvalidEnvelopeError } from '../events/envelope';
import { isSelfCreated } from '../events/self-change';
import { classifyError } from '../errors/classify';
import { handleOrderCreatedMessage } from '../handlers/order-confirmation.handler';
import { handleOrderStateChanged } from '../handlers/order-state-change.handler';
import { handleOrderStateTransitioned } from '../handlers/order-state-transitioned.handler';
import { handleShipmentStateChanged } from '../handlers/shipment-state-change.handler';
import { handleReturnInfo } from '../handlers/order-refund.handler';
import { handleCustomerCreated } from '../handlers/customer-registration.handler';
import { handleCustomerPasswordTokenCreated } from '../handlers/customer-password-token-creation.handler';
import { readChannelConfiguration } from '../utils/config.utils';
import { loadAdditionalLocalizations } from '../utils/localization.utils';
import { getProject } from '../ctp/project';
import { loadMappings } from '../mappings/mapping-store';
import { getProviders } from '../providers';
import { decideAck, dispatchNotification, type ChannelOutcome } from '../notifications/dispatch';
import type { NotificationContext } from '../notifications/context';

const buildContext = (message: Message, languages: string[]): Promise<NotificationContext | undefined> => {
  switch (message.type) {
    case 'CustomerCreated':
      return handleCustomerCreated(message, languages);
    case 'CustomerPasswordTokenCreated':
      return handleCustomerPasswordTokenCreated(message, languages);
    case 'OrderImported':
    case 'OrderCreated':
      return handleOrderCreatedMessage(message, languages);
    case 'OrderStateChanged':
      return handleOrderStateChanged(message, languages);
    case 'OrderShipmentStateChanged':
      return handleShipmentStateChanged(message, languages);
    case 'OrderStateTransition':
      return handleOrderStateTransitioned(message, languages);
    case 'ReturnInfoAdded':
    case 'ReturnInfoSet':
      return handleReturnInfo(message, languages);
    default:
      return Promise.resolve(undefined);
  }
};

const logOutcome = (base: Record<string, unknown>, outcome: ChannelOutcome) => {
  const fields: Record<string, unknown> = { ...base, channel: outcome.channel, status: outcome.status };
  if (outcome.status === 'skipped' || outcome.status === 'failed') fields.reason = outcome.reason;
  if (outcome.status === 'sent' && outcome.providerId) fields.providerId = outcome.providerId;
  if (outcome.status === 'failed') {
    logger.error('Notification outcome', { ...fields, kind: outcome.kind });
  } else {
    logger.info('Notification outcome', fields);
  }
};

/**
 * Event endpoint. Acknowledgement rules (the broker redelivers on any non-2xx):
 *  - 204 at least one channel sent, or nothing needed sending (skipped channels are logged)
 *  - 200 not for us, self-created, invalid envelope, or a permanent failure (logged, never retried)
 *  - 503 no channel sent and at least one transient failure (network, timeout, 429, 5xx)
 */
export const post = async (request: Request, response: Response) => {
  let message: Message;
  try {
    message = decodeEnvelope(request.body);
  } catch (error) {
    if (error instanceof InvalidEnvelopeError) {
      logger.info('Acknowledging delivery that is not a commercetools message', {
        reason: error.message,
      });
      response.status(200).send();
      return;
    }
    throw error;
  }

  const log = {
    messageId: message.id,
    type: message.type,
    resourceId: message.resource.id,
    sequenceNumber: message.sequenceNumber,
  };

  if (isSelfCreated(message)) {
    logger.info('Ignoring change made by this connector', log);
    response.status(200).send();
    return;
  }

  try {
    const { languages } = await getProject();
    const context = await buildContext(message, languages);
    if (!context) {
      logger.info('No notification configured for message type', log);
      response.status(200).send();
      return;
    }

    const templates = await loadMappings();
    const messages = await loadAdditionalLocalizations(message.type, context.locale, languages, true);
    const outcomes = await dispatchNotification(context, {
      templates,
      providers: getProviders(),
      channels: readChannelConfiguration(),
      messages,
      messageId: message.id,
      resourceId: message.resource.id,
    });

    const base = { ...log, notification: context.notification };
    outcomes.forEach((outcome) => logOutcome(base, outcome));
    response.status(decideAck(outcomes)).send();
  } catch (error) {
    const kind = classifyError(error);
    logger.error('Notification failed', {
      ...log,
      kind,
      error: (error as Error).message,
    });
    response.status(kind === 'transient' ? 503 : 200).send();
  }
};
