import { type FC } from 'react';
import { useIntl } from 'react-intl';
import { useIsAuthorized } from '@commercetools-frontend/permissions';
import { useShowNotification } from '@commercetools-frontend/actions-global';
import {
  DOMAINS,
  NOTIFICATION_KINDS_SIDE,
} from '@commercetools-frontend/constants';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { PERMISSIONS, CONTAINER_KEY } from '../../constants';
import { useCustomObjectUpdater } from '../../hooks/use-custom-object-connector/use-custom-object-connector';
import { Localizations } from '../../types';
import { createLocalizedString } from '../../utils/localized-string';
import LocalizationForm from '../localization-form/localization-form';
import messages from './messages';

export type Props = { onClose: () => void };

const LocalizationCreate: FC<Props> = ({ onClose }) => {
  const intl = useIntl();
  const canManage = useIsAuthorized({
    demandedPermissions: [PERMISSIONS.Manage],
  });
  const showNotification = useShowNotification();
  const customObjectUpdater = useCustomObjectUpdater();
  const projectLanguages = useApplicationContext(
    (context) => context.project?.languages ?? []
  );

  const handleSubmit = async (values: Localizations) => {
    const { key, ...rest } = values;
    await customObjectUpdater.execute({
      draft: { container: CONTAINER_KEY, key, value: JSON.stringify(rest) },
      onCompleted() {
        showNotification({
          kind: NOTIFICATION_KINDS_SIDE.success,
          domain: DOMAINS.SIDE,
          text: intl.formatMessage(messages.createSuccess),
        });
        onClose();
      },
      onError(message?: string) {
        showNotification({
          kind: NOTIFICATION_KINDS_SIDE.error,
          domain: DOMAINS.SIDE,
          text: intl.formatMessage(messages.createError, {
            message: message ?? '',
          }),
        });
      },
    });
  };

  return (
    <LocalizationForm
      mode="create"
      title={intl.formatMessage(messages.title)}
      canManage={canManage}
      initialValues={{
        key: '',
        name: createLocalizedString(projectLanguages),
        entries: [],
      }}
      onSubmit={handleSubmit}
      onClose={onClose}
    />
  );
};

export default LocalizationCreate;
