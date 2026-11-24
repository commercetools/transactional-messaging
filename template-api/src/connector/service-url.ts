import type { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk';
import { isAllowedServiceUrl } from '../utils/service-origin';

/** The Merchant Center app reads this object to find the service. Keep both in step with notification-manager. */
export const CONFIG_CONTAINER = 'transactional-messaging';
export const CONFIG_KEY = 'template-api';

/** CONNECT_SERVICE_URL already ends in the application endpoint, so it is stored as it is. */
export const normaliseServiceUrl = (value: string | undefined): string => {
  if (!value) throw new Error('CONNECT_SERVICE_URL is not set');
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('CONNECT_SERVICE_URL is not a valid URL');
  }
  if (!isAllowedServiceUrl(url))
    throw new Error(
      'CONNECT_SERVICE_URL must use https (http is allowed only for localhost)'
    );
  return `${url.origin}${url.pathname}`.replace(/\/+$/, '');
};

export const saveServiceUrl = async (
  apiRoot: ByProjectKeyRequestBuilder,
  url: string
): Promise<void> => {
  await apiRoot
    .customObjects()
    .post({
      body: { container: CONFIG_CONTAINER, key: CONFIG_KEY, value: { url } },
    })
    .execute();
};

/** Returns true when an object was removed. A missing object is not an error. */
export const removeServiceUrl = async (
  apiRoot: ByProjectKeyRequestBuilder
): Promise<boolean> => {
  try {
    await apiRoot
      .customObjects()
      .withContainerAndKey({ container: CONFIG_CONTAINER, key: CONFIG_KEY })
      .delete()
      .execute();
    return true;
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 404) return false;
    throw error;
  }
};
