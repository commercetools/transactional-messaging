import { ensureSubscription, deleteSubscription, SUBSCRIPTION_KEY } from '../../src/connector/subscription';

const destination = { type: 'GoogleCloudPubSub', topic: 't', projectId: 'p' } as const;

type Draft = {
  key: string;
  destination: unknown;
  messages: { resourceTypeId: string; types: string[] }[];
};
const firstCallBody = (mock: jest.Mock): Draft => (mock.mock.calls[0] as [{ body: Draft }])[0].body;

const makeApiRoot = (existing?: { version: number }) => {
  const execute = jest.fn();
  const subscriptions = {
    get: jest.fn(() => ({ execute: () => Promise.resolve({ body: { results: existing ? [existing] : [] } }) })),
    post: jest.fn(() => ({ execute })),
    withKey: jest.fn(() => ({
      post: jest.fn(() => ({ execute })),
      delete: jest.fn(() => ({ execute })),
    })),
  };
  return { apiRoot: { subscriptions: () => subscriptions } as never, subscriptions, execute };
};

describe('ensureSubscription', () => {
  it('creates the subscription when none exists', async () => {
    const { apiRoot, subscriptions } = makeApiRoot();
    await expect(ensureSubscription(apiRoot, destination)).resolves.toBe('created');
    const body = firstCallBody(subscriptions.post);
    expect(body.key).toBe(SUBSCRIPTION_KEY);
    expect(body.destination).toEqual(destination);
  });

  it('updates destination and messages in place when it exists, never deleting first', async () => {
    const { apiRoot, subscriptions } = makeApiRoot({ version: 4 });
    await expect(ensureSubscription(apiRoot, destination)).resolves.toBe('updated');
    expect(subscriptions.post).not.toHaveBeenCalled();
    const actions = (subscriptions.withKey.mock.results[0].value.post.mock.calls[0] as [{ body: { version: number; actions: { action: string }[] } }])[0].body;
    expect(actions.version).toBe(4);
    expect(actions.actions.map((a) => a.action)).toEqual([
      'changeDestination',
      'setMessages',
    ]);
  });

  it('registers the customer-password-token resource type for password reset messages', async () => {
    const { apiRoot, subscriptions } = makeApiRoot();
    await ensureSubscription(apiRoot, destination);
    const messages = firstCallBody(subscriptions.post).messages;
    expect(messages).toContainEqual({
      resourceTypeId: 'customer-password-token',
      types: ['CustomerPasswordTokenCreated'],
    });
  });
});

describe('deleteSubscription', () => {
  it('returns false and does nothing when there is no subscription', async () => {
    const { apiRoot, subscriptions } = makeApiRoot();
    await expect(deleteSubscription(apiRoot)).resolves.toBe(false);
    expect(subscriptions.withKey).not.toHaveBeenCalled();
  });

  it('deletes the subscription by key with its version', async () => {
    const { apiRoot, subscriptions } = makeApiRoot({ version: 2 });
    await expect(deleteSubscription(apiRoot)).resolves.toBe(true);
    const deleteCall = (subscriptions.withKey.mock.results[0].value.delete.mock.calls[0] as [{ queryArgs: unknown }])[0];
    expect(deleteCall.queryArgs).toEqual({ version: 2 });
  });
});
