import { type FC } from 'react';
import { useIntl } from 'react-intl';
import { useParams } from 'react-router';
import { useIsAuthorized } from '@commercetools-frontend/permissions';
import { Alert, LoadingSpinner, Stack } from '@commercetools/nimbus';
import type { TemplateApi } from '../../api/template-api';
import { PERMISSIONS } from '../../constants';
import { useLocalizations } from '../../hooks/use-template-api/use-localizations';
import { templatesUsingPart } from '../../templates/parts';
import messages from './messages';
import TemplateForm from './template-form';
import { usePartSave, type TemplateLibrary } from './use-part-save';

type Props = {
  api: TemplateApi;
  library: TemplateLibrary;
  loading: boolean;
  onClose: () => void;
};

const PartEdit: FC<Props> = ({ api, library, loading, onClose }) => {
  const intl = useIntl();
  const { key } = useParams<{ key: string }>();
  const canManage = useIsAuthorized({
    demandedPermissions: [PERMISSIONS.Manage],
  });
  const { localizations, loading: localizationsLoading } = useLocalizations();
  const save = usePartSave(api, library, onClose);

  if (loading || localizationsLoading) {
    return (
      <Stack alignItems="center">
        <LoadingSpinner />
      </Stack>
    );
  }
  const part = library.parts.find((candidate) => candidate.key === key);
  if (!part) {
    return (
      <Alert.Root colorPalette="critical">
        <Alert.Description>
          {intl.formatMessage(messages.partNotFound)}
        </Alert.Description>
      </Alert.Root>
    );
  }

  const usage = templatesUsingPart(
    part.key,
    library.parts,
    [...library.mjmlById].map(([id, mjml]) => ({ id, mjml }))
  ).length;

  return (
    <TemplateForm
      mode="edit"
      title={intl.formatMessage(messages.editTitle)}
      initialValues={{
        name: part.name,
        channel: 'part',
        notification: part.notification,
        subject: '',
        content: part.mjml,
      }}
      localizations={localizations}
      canManage={canManage}
      parts={library.parts}
      partKey={part.key}
      usageCount={usage}
      onSubmit={(values) => save(part.key, values)}
      onClose={onClose}
    />
  );
};

export default PartEdit;
