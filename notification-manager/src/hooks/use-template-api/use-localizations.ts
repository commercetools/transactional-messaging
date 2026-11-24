import { CONTAINER_KEY, LOCALIZATIONS_KEY } from '../../constants';
import { useCustomObjectFetcher } from '../use-custom-object-connector/use-custom-object-connector';
import type { Localizations } from '../../types';

/** The localization entries saved for the project, or undefined to fall back to the bundled defaults. */
export const useLocalizations = (): {
  localizations?: Localizations;
  loading: boolean;
} => {
  const { customObject, loading } = useCustomObjectFetcher({
    container: CONTAINER_KEY,
    key: LOCALIZATIONS_KEY,
  });
  const value = customObject?.value as Localizations | undefined | null;
  return {
    localizations: value && Array.isArray(value.entries) ? value : undefined,
    loading,
  };
};
