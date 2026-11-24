import { buildDestination } from '../../src/connector/destination';

describe('buildDestination', () => {
  it('builds a Pub/Sub destination when Connect says so', () => {
    expect(
      buildDestination({
        CONNECT_SUBSCRIPTION_DESTINATION: 'GoogleCloudPubSub',
        CONNECT_GCP_TOPIC_NAME: 'topic',
        CONNECT_GCP_PROJECT_ID: 'project',
      })
    ).toEqual({ type: 'GoogleCloudPubSub', topic: 'topic', projectId: 'project' });
  });

  it('defaults to Pub/Sub when the destination variable is absent', () => {
    expect(
      buildDestination({ CONNECT_GCP_TOPIC_NAME: 'topic', CONNECT_GCP_PROJECT_ID: 'project' })
    ).toMatchObject({ type: 'GoogleCloudPubSub' });
  });

  it('builds an IAM SNS destination on AWS', () => {
    expect(
      buildDestination({
        CONNECT_SUBSCRIPTION_DESTINATION: 'SNS',
        CONNECT_AWS_TOPIC_ARN: 'arn:aws:sns:eu-central-1:1:topic',
      })
    ).toEqual({
      type: 'SNS',
      topicArn: 'arn:aws:sns:eu-central-1:1:topic',
      authenticationMode: 'IAM',
    });
  });

  it('names the missing variable', () => {
    expect(() => buildDestination({ CONNECT_SUBSCRIPTION_DESTINATION: 'SNS' })).toThrow(
      'CONNECT_AWS_TOPIC_ARN is not set'
    );
  });

  it('refuses an unknown destination type instead of guessing', () => {
    expect(() => buildDestination({ CONNECT_SUBSCRIPTION_DESTINATION: 'AzureServiceBus' })).toThrow(
      'Unknown subscription destination type'
    );
  });
});
