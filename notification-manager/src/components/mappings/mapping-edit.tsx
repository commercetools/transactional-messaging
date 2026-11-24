import { type FC } from 'react';
import { useIntl } from 'react-intl';
import { useParams } from 'react-router';
import { useIsAuthorized } from '@commercetools-frontend/permissions';
import { useShowNotification } from '@commercetools-frontend/actions-global';
import {
  DOMAINS,
  NOTIFICATION_KINDS_SIDE,
} from '@commercetools-frontend/constants';
import { Alert, LoadingSpinner, Stack } from '@commercetools/nimbus';
import { PERMISSIONS } from '../../constants';
import {
  MAPPINGS_CONTAINER,
  parseNotificationMapping,
} from '../../shared/mappings/notification-mapping';
import {
  useCustomObjectDeleter,
  useCustomObjectFetcher,
  useCustomObjectUpdater,
} from '../../hooks/use-custom-object-connector/use-custom-object-connector';
import { getErrorMessage } from '../../helpers';
import messages from './messages';
import MappingForm from './mapping-form';
import { buildMappingValue, type MappingFormValues } from './mapping-helpers';

export type Props = { onClose: () => void };

const CONFLICT_PATTERN = /concurrent|version/i;

const MappingEdit: FC<Props> = ({ onClose }) => {
  const intl = useIntl();
  const { id } = useParams<{ id: string }>();
  const canManage = useIsAuthorized({
    demandedPermissions: [PERMISSIONS.Manage],
  });
  const showNotification = useShowNotification();
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

  const mapping = parseNotificationMapping(customObject.value);
  const notify = (kind: 'success' | 'error', text: string) =>
    showNotification({
      kind:
        kind === 'success'
          ? NOTIFICATION_KINDS_SIDE.success
          : NOTIFICATION_KINDS_SIDE.error,
      domain: DOMAINS.SIDE,
      text,
    });

  if (!mapping) {
    return (
      <Stack direction="column" gap="400">
        <Alert.Root colorPalette="critical">
          <Alert.Description>
            {intl.formatMessage(messages.invalidMapping)}
          </Alert.Description>
        </Alert.Root>
      </Stack>
    );
  }

  const initialValues: MappingFormValues = {
    notification: mapping.notification,
    channel: mapping.channel,
    enabled: mapping.enabled,
    templateId: mapping.templateId,
  };

  const handleSubmit = async (values: MappingFormValues) => {
    const value = buildMappingValue(values);
    try {
      await customObjectUpdater.execute({
        // Passing the version makes a concurrent edit fail instead of silently overwriting it.
        draft: {
          container: MAPPINGS_CONTAINER,
          key: customObject.key,
          value: JSON.stringify(value),
          version: customObject.version,
        },
        onCompleted() {
          notify('success', intl.formatMessage(messages.saveSuccess));
          onClose();
        },
        onError(message?: string) {
          const text =
            message && CONFLICT_PATTERN.test(message)
              ? intl.formatMessage(messages.conflict)
              : intl.formatMessage(messages.saveError, {
                  message: message ?? '',
                });
          notify('error', text);
        },
      });
    } catch (err) {
      notify(
        'error',
        intl.formatMessage(messages.saveError, {
          message: (err as Error).message,
        })
      );
    }
  };

  const handleDelete = async () => {
    await customObjectDeleter.execute({
      container: MAPPINGS_CONTAINER,
      key: customObject.key,
      onCompleted() {
        notify('success', intl.formatMessage(messages.deleteSuccess));
        onClose();
      },
      onError(message?: string) {
        notify(
          'error',
          intl.formatMessage(messages.saveError, { message: message ?? '' })
        );
      },
    });
  };

  return (
    <MappingForm
      mode="edit"
      title={intl.formatMessage(messages.editTitle)}
      initialValues={initialValues}
      existingKeys={[]}
      canManage={canManage}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      onClose={onClose}
    />
  );
};

export default MappingEdit;
