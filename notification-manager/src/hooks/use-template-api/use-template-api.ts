import { useMemo } from 'react';
import { useCustomObjectFetcher } from '../use-custom-object-connector/use-custom-object-connector';
import { createTemplateApi, type TemplateApi } from '../../api/template-api';
import { SERVICE_CONFIG_CONTAINER, SERVICE_CONFIG_KEY } from '../../constants';
import { getErrorMessage } from '../../helpers';
import { urlOf } from './service-url';

export type TemplateApiState =
  | { status: 'loading' }
  /** The connector has not stored the service URL, so it is not deployed or its post-deploy did not run. */
  | { status: 'missing' }
  | { status: 'error'; message: string }
  | { status: 'ready'; api: TemplateApi };

/** Finds the template service the connector registered and returns a client for it. */
export const useTemplateApi = (): TemplateApiState => {
  const { customObject, loading, error } = useCustomObjectFetcher({
    container: SERVICE_CONFIG_CONTAINER,
    key: SERVICE_CONFIG_KEY,
  });
  const url = urlOf(customObject?.value);
  const api = useMemo(() => (url ? createTemplateApi(url) : undefined), [url]);

  if (loading) return { status: 'loading' };
  if (error) return { status: 'error', message: getErrorMessage(error) };
  if (!api) return { status: 'missing' };
  return { status: 'ready', api };
};
