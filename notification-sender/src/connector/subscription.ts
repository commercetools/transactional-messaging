import type { ByProjectKeyRequestBuilder, Destination, SubscriptionDraft } from '@commercetools/platform-sdk';

export const SUBSCRIPTION_KEY = 'transactional-messaging-subscription';

/** Every message type the notification registry handles. Keep in sync with notifications/registry. */
export const SUBSCRIPTION_MESSAGES: NonNullable<SubscriptionDraft['messages']> = [
  { resourceTypeId: 'customer', types: ['CustomerCreated'] },
  { resourceTypeId: 'customer-password-token', types: ['CustomerPasswordTokenCreated'] },
  {
    resourceTypeId: 'order',
    types: [
      'OrderCreated',
      'OrderImported',
      'OrderStateChanged',
      'OrderStateTransition',
      'OrderShipmentStateChanged',
      'ReturnInfoAdded',
      'ReturnInfoSet',
    ],
  },
];

const findByKey = async (apiRoot: ByProjectKeyRequestBuilder) => {
  const { body } = await apiRoot
    .subscriptions()
    .get({ queryArgs: { where: `key = "${SUBSCRIPTION_KEY}"` } })
    .execute();
  return body.results[0];
};

/**
 * Creates the subscription, or updates its destination and messages in place.
 * Updating in place avoids the window where no subscription exists.
 */
export const ensureSubscription = async (
  apiRoot: ByProjectKeyRequestBuilder,
  destination: Destination
): Promise<'created' | 'updated'> => {
  const existing = await findByKey(apiRoot);
  if (!existing) {
    await apiRoot
      .subscriptions()
      .post({
        body: { key: SUBSCRIPTION_KEY, destination, messages: SUBSCRIPTION_MESSAGES },
      })
      .execute();
    return 'created';
  }

  await apiRoot
    .subscriptions()
    .withKey({ key: SUBSCRIPTION_KEY })
    .post({
      body: {
        version: existing.version,
        actions: [
          { action: 'changeDestination', destination },
          { action: 'setMessages', messages: SUBSCRIPTION_MESSAGES },
        ],
      },
    })
    .execute();
  return 'updated';
};

/** Removes the subscription if it exists. Merchant data is never touched. */
export const deleteSubscription = async (apiRoot: ByProjectKeyRequestBuilder): Promise<boolean> => {
  const existing = await findByKey(apiRoot);
  if (!existing) return false;
  await apiRoot
    .subscriptions()
    .withKey({ key: SUBSCRIPTION_KEY })
    .delete({ queryArgs: { version: existing.version } })
    .execute();
  return true;
};
