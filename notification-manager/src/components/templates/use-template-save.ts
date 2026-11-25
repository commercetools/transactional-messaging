import { useIntl } from 'react-intl';
import { useShowNotification } from '@commercetools-frontend/actions-global';
import {
  DOMAINS,
  NOTIFICATION_KINDS_SIDE,
} from '@commercetools-frontend/constants';
import type { TemplateApi } from '../../api/template-api';
import { TEMPLATE_SOURCES_CONTAINER } from '../../constants';
import { useCustomObjectUpdater } from '../../hooks/use-custom-object-connector/use-custom-object-connector';
import type { TemplateSource } from '../../templates/template-source';
import messages from './messages';
import {
  buildTemplateInput,
  type TemplateFormValues,
} from './template-helpers';

/**
 * Saves a template to SendGrid through the template service, then records its source (the MJML and the
 * notification) so it can be edited again. Returns true when the template itself was saved.
 */
export const useTemplateSave = (api: TemplateApi, onSaved: () => void) => {
  const intl = useIntl();
  const showNotification = useShowNotification();
  const sourceUpdater = useCustomObjectUpdater();

  const notify = (kind: 'success' | 'error', text: string) =>
    showNotification({
      kind:
        kind === 'success'
          ? NOTIFICATION_KINDS_SIDE.success
          : NOTIFICATION_KINDS_SIDE.error,
      domain: DOMAINS.SIDE,
      text,
    });

  return async (
    existingId: string | undefined,
    values: TemplateFormValues,
    html: string
  ): Promise<void> => {
    const channel = values.channel;
    if (channel === 'part')
      throw new Error('Parts are saved with usePartSave.');
    const input = buildTemplateInput({ ...values, channel }, html);
    let id: string;
    try {
      const saved = existingId
        ? await api.update(existingId, input)
        : await api.create(input);
      id = saved.id;
    } catch (error) {
      notify(
        'error',
        intl.formatMessage(messages.saveError, {
          message: (error as Error).message,
        })
      );
      return;
    }

    const source: TemplateSource = {
      schemaVersion: 1,
      notification: values.notification as TemplateSource['notification'],
      channel,
      ...(channel === 'email' ? { mjml: values.content } : {}),
    };
    let failure: string | undefined;
    try {
      await sourceUpdater.execute({
        draft: {
          container: TEMPLATE_SOURCES_CONTAINER,
          key: id,
          value: JSON.stringify(source),
        },
        onError(message?: string) {
          failure = message ?? 'Unknown error';
        },
      });
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
    }
    if (failure !== undefined) {
      // The template exists in SendGrid, but it would show as read-only until the source is stored.
      notify(
        'error',
        intl.formatMessage(messages.sourceSaveError, { message: failure })
      );
      onSaved();
      return;
    }
    notify('success', intl.formatMessage(messages.saveSuccess));
    onSaved();
  };
};
