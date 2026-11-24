import { type FC, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { useParams } from 'react-router';
import { useIsAuthorized } from '@commercetools-frontend/permissions';
import { Alert, LoadingSpinner, Stack } from '@commercetools/nimbus';
import type { TemplateApi } from '../../api/template-api';
import { PERMISSIONS, TEMPLATE_SOURCES_CONTAINER } from '../../constants';
import { getErrorMessage } from '../../helpers';
import { useCustomObjectFetcher } from '../../hooks/use-custom-object-connector/use-custom-object-connector';
import { useAsync } from '../../hooks/use-template-api/use-async';
import { useLocalizations } from '../../hooks/use-template-api/use-localizations';
import { defaultContent } from '../../templates/defaults';
import { parseTemplateSource } from '../../templates/template-source';
import messages from './messages';
import TemplateForm from './template-form';
import type { TemplateFormValues } from './template-helpers';
import { useTemplateSave } from './use-template-save';

type Props = { api: TemplateApi; onClose: () => void };

const TemplateEdit: FC<Props> = ({ api, onClose }) => {
  const intl = useIntl();
  const { id } = useParams<{ id: string }>();
  const canManage = useIsAuthorized({
    demandedPermissions: [PERMISSIONS.Manage],
  });
  const { localizations, loading: localizationsLoading } = useLocalizations();
  const load = useCallback(() => api.get(id), [api, id]);
  const [template] = useAsync(load);
  const source = useCustomObjectFetcher({
    container: TEMPLATE_SOURCES_CONTAINER,
    key: id,
  });
  const save = useTemplateSave(api, onClose);

  if (template.status === 'error') {
    return (
      <Alert.Root colorPalette="critical">
        <Alert.Description>
          {intl.formatMessage(messages.loadError, {
            message: template.error.message,
          })}
        </Alert.Description>
      </Alert.Root>
    );
  }
  if (source.error) {
    return (
      <Alert.Root colorPalette="critical">
        <Alert.Description>{getErrorMessage(source.error)}</Alert.Description>
      </Alert.Root>
    );
  }
  if (template.status === 'loading' || source.loading || localizationsLoading) {
    return (
      <Stack alignItems="center">
        <LoadingSpinner />
      </Stack>
    );
  }

  const detail = template.data;
  const stored = parseTemplateSource(source.customObject?.value);
  // A source for the other channel would be stale (the channel cannot change), so treat it as missing.
  const editable =
    stored && stored.channel === detail.channel ? stored : undefined;

  const initialValues: TemplateFormValues = {
    name: detail.name,
    channel: detail.channel,
    notification: editable?.notification ?? '',
    subject: detail.subject,
    content: editable
      ? detail.channel === 'email'
        ? editable.mjml ?? defaultContent(editable.notification, 'email')
        : detail.text
      : '',
  };

  return (
    <TemplateForm
      mode="edit"
      title={intl.formatMessage(messages.editTitle)}
      initialValues={initialValues}
      localizations={localizations}
      canManage={canManage}
      external={
        editable
          ? undefined
          : { subject: detail.subject, html: detail.html, text: detail.text }
      }
      onSubmit={(values, html) => save(id, values, html)}
      onClose={onClose}
    />
  );
};

export default TemplateEdit;
