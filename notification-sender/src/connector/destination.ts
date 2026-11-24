import type { Destination } from '@commercetools/platform-sdk';

const required = (env: NodeJS.ProcessEnv, name: string): string => {
  const value = env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
};

/**
 * Builds the Subscription destination from the variables Connect injects into postDeploy.
 * Branches on CONNECT_SUBSCRIPTION_DESTINATION; never assumes Pub/Sub.
 */
export const buildDestination = (env: NodeJS.ProcessEnv): Destination => {
  const type = env.CONNECT_SUBSCRIPTION_DESTINATION;
  if (type === 'SNS') {
    return {
      type: 'SNS',
      topicArn: required(env, 'CONNECT_AWS_TOPIC_ARN'),
      authenticationMode: 'IAM',
    };
  }
  if (type === 'GoogleCloudPubSub' || type === undefined) {
    return {
      type: 'GoogleCloudPubSub',
      topic: required(env, 'CONNECT_GCP_TOPIC_NAME'),
      projectId: required(env, 'CONNECT_GCP_PROJECT_ID'),
    };
  }
  throw new Error(`Unknown subscription destination type: ${type}`);
};
