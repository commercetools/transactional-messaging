import { type FC } from 'react';
import { useIntl } from 'react-intl';
import { useIsAuthorized } from '@commercetools-frontend/permissions';
import { useShowNotification } from '@commercetools-frontend/actions-global';
import {
  DOMAINS,
  NOTIFICATION_KINDS_SIDE,
} from '@commercetools-frontend/constants';
import { PERMISSIONS } from '../../constants';
import {
  MAPPINGS_CONTAINER,
  mappingKey,
} from '../../shared/mappings/notification-mapping';
import { useCustomObjectUpdater } from '../../hooks/use-custom-object-connector/use-custom-object-connector';
import messages from './messages';
import MappingForm from './mapping-form';
import {
  buildMappingValue,
  emptyFormValues,
  type MappingFormValues,
} from './mapping-helpers';

export type Props = { existingKeys: string[]; onClose: () => void };

const MappingCreate: FC<Props> = ({ existingKeys, onClose }) => {
  const intl = useIntl();
  const canManage = useIsAuthorized({
    demandedPermissions: [PERMISSIONS.Manage],
  });
  const showNotification = useShowNotification();
  const customObjectUpdater = useCustomObjectUpdater();

  const handleSubmit = async (values: MappingFormValues) => {
    const value = buildMappingValue(values);
    const key = mappingKey(value.notification, value.channel);
    try {
      await customObjectUpdater.execute({
        draft: {
          container: MAPPINGS_CONTAINER,
          key,
          value: JSON.stringify(value),
        },
        onCompleted() {
          showNotification({
            kind: NOTIFICATION_KINDS_SIDE.success,
            domain: DOMAINS.SIDE,
            text: intl.formatMessage(messages.saveSuccess),
          });
          onClose();
        },
        onError(message?: string) {
          showNotification({
            kind: NOTIFICATION_KINDS_SIDE.error,
            domain: DOMAINS.SIDE,
            text: intl.formatMessage(messages.saveError, {
              message: message ?? '',
            }),
          });
        },
      });
    } catch (error) {
      showNotification({
        kind: NOTIFICATION_KINDS_SIDE.error,
        domain: DOMAINS.SIDE,
        text: intl.formatMessage(messages.saveError, {
          message: (error as Error).message,
        }),
      });
    }
  };

  return (
    <MappingForm
      mode="create"
      title={intl.formatMessage(messages.createTitle)}
      initialValues={emptyFormValues()}
      existingKeys={existingKeys}
      canManage={canManage}
      onSubmit={handleSubmit}
      onClose={onClose}
    />
  );
};

export default MappingCreate;
