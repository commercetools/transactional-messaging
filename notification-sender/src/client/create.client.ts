import { createApiBuilderFromCtpClient, type ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk';
import { createClient } from './build.client';
import { readConfiguration } from '../utils/config.utils';

let apiRoot: ByProjectKeyRequestBuilder | undefined;

/** Memoised project-scoped API root. */
export const createApiRoot = (): ByProjectKeyRequestBuilder => {
  if (!apiRoot) {
    apiRoot = createApiBuilderFromCtpClient(createClient()).withProjectKey({
      projectKey: readConfiguration().projectKey,
    });
  }
  return apiRoot;
};
