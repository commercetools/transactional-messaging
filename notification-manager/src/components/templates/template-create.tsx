import { type FC } from 'react';
import { useIntl } from 'react-intl';
import { useIsAuthorized } from '@commercetools-frontend/permissions';
import type { TemplateApi } from '../../api/template-api';
import { PERMISSIONS } from '../../constants';
import { useLocalizations } from '../../hooks/use-template-api/use-localizations';
import messages from './messages';
import TemplateForm from './template-form';
import { emptyFormValues } from './template-helpers';
import { useTemplateSave } from './use-template-save';

type Props = { api: TemplateApi; onClose: () => void };

const TemplateCreate: FC<Props> = ({ api, onClose }) => {
  const intl = useIntl();
  const canManage = useIsAuthorized({
    demandedPermissions: [PERMISSIONS.Manage],
  });
  const { localizations } = useLocalizations();
  const save = useTemplateSave(api, onClose);

  return (
    <TemplateForm
      mode="create"
      title={intl.formatMessage(messages.createTitle)}
      initialValues={emptyFormValues()}
      localizations={localizations}
      canManage={canManage}
      onSubmit={(values, html) => save(undefined, values, html)}
      onClose={onClose}
    />
  );
};

export default TemplateCreate;
