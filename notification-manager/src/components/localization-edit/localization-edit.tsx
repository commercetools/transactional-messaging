import { type FC } from 'react';
import { useIntl } from 'react-intl';
import { useParams } from 'react-router';
import { useIsAuthorized } from '@commercetools-frontend/permissions';
import { useShowNotification } from '@commercetools-frontend/actions-global';
import {
  DOMAINS,
  NOTIFICATION_KINDS_SIDE,
} from '@commercetools-frontend/constants';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { Alert, LoadingSpinner, Stack } from '@commercetools/nimbus';
import { PERMISSIONS, CONTAINER_KEY } from '../../constants';
import {
  useCustomObjectDeleter,
  useCustomObjectFetcher,
  useCustomObjectUpdater,
} from '../../hooks/use-custom-object-connector/use-custom-object-connector';
import { Localizations } from '../../types';
import { getErrorMessage, castValue } from '../../helpers';
import { createLocalizedString } from '../../utils/localized-string';
import LocalizationForm from '../localization-form/localization-form';
import messages from './messages';

export type Props = { onClose: () => void };

const LocalizationEdit: FC<Props> = ({ onClose }) => {
  const intl = useIntl();
  const { id } = useParams<{ id: string }>();
  const canManage = useIsAuthorized({
    demandedPermissions: [PERMISSIONS.Manage],
  });
  const showNotification = useShowNotification();
  const projectLanguages = useApplicationContext(
    (context) => context.project?.languages ?? []
  );
  const { customObject, loading, error } = useCustomObjectFetcher({ id });
  const customObjectUpdater = useCustomObjectUpdater();
  const customObjectDeleter = useCustomObjectDeleter();

  if (error) {
    return (
      <Alert.Root colorPalette="critical">
        <Alert.Description>{getErrorMessage(error)}</Alert.Description>
      </Alert.Root>
    );
  }
  if (loading || !customObject) {
    return (
      <Stack alignItems="center">
        <LoadingSpinner />
      </Stack>
    );
  }

  const casted = castValue(customObject);

  const handleSubmit = async (values: Localizations) => {
    const { key, ...rest } = values;
    await customObjectUpdater.execute({
      draft: { container: CONTAINER_KEY, key, value: JSON.stringify(rest) },
      onCompleted() {
        showNotification({
          kind: NOTIFICATION_KINDS_SIDE.success,
          domain: DOMAINS.SIDE,
          text: intl.formatMessage(messages.editSuccess),
        });
      },
      onError(message?: string) {
        showNotification({
          kind: NOTIFICATION_KINDS_SIDE.error,
          domain: DOMAINS.SIDE,
          text: intl.formatMessage(messages.editError, {
            message: message ?? '',
          }),
        });
      },
    });
  };

  const handleDelete = async () => {
    await customObjectDeleter.execute({
      container: customObject.container,
      key: customObject.key,
      onCompleted() {
        showNotification({
          kind: NOTIFICATION_KINDS_SIDE.success,
          domain: DOMAINS.SIDE,
          text: intl.formatMessage(messages.deleteSuccess),
        });
        onClose();
      },
      onError(message?: string) {
        showNotification({
          kind: NOTIFICATION_KINDS_SIDE.error,
          domain: DOMAINS.SIDE,
          text: intl.formatMessage(messages.editError, {
            message: message ?? '',
          }),
        });
      },
    });
  };

  return (
    <LocalizationForm
      mode="edit"
      title={intl.formatMessage(messages.title)}
      canManage={canManage}
      initialValues={{
        ...casted,
        key: customObject.key,
        name: createLocalizedString(projectLanguages, casted.name),
        entries: casted.entries ?? [],
      }}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      onClose={onClose}
    />
  );
};

export default LocalizationEdit;
