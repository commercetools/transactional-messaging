import { useIntl } from 'react-intl';
import { useShowNotification } from '@commercetools-frontend/actions-global';
import {
  DOMAINS,
  NOTIFICATION_KINDS_SIDE,
} from '@commercetools-frontend/constants';
import type { TemplateApi } from '../../api/template-api';
import { TEMPLATE_PARTS_CONTAINER } from '../../constants';
import { useCustomObjectUpdater } from '../../hooks/use-custom-object-connector/use-custom-object-connector';
import type { NotificationKey } from '../../shared/notifications/keys';
import {
  newPartKey,
  partValue,
  templatesUsingPart,
  type TemplatePart,
} from '../../templates/parts';
import { loadMjml } from '../../templates/preview';
import { republishTemplates } from '../../templates/republish';
import messages from './messages';
import type { TemplateFormValues } from './template-helpers';

/** What the templates page knows about every template and part, for resolving includes. */
export type TemplateLibrary = {
  parts: TemplatePart[];
  /** Stored MJML of each email template written here, by SendGrid ID. */
  mjmlById: ReadonlyMap<string, string | undefined>;
  nameById: ReadonlyMap<string, string>;
};

/**
 * Saves a part as a Custom Object, then saves again, in SendGrid, every template that uses it, because
 * SendGrid only has the compiled HTML with the old part copied in.
 */
export const usePartSave = (
  api: TemplateApi,
  library: TemplateLibrary,
  onSaved: () => void
) => {
  const intl = useIntl();
  const showNotification = useShowNotification();
  const updater = useCustomObjectUpdater();

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
    existingKey: string | undefined,
    values: TemplateFormValues
  ): Promise<void> => {
    const part: TemplatePart = {
      schemaVersion: 1,
      key:
        existingKey ??
        newPartKey(
          values.name,
          library.parts.map((existing) => existing.key)
        ),
      name: values.name.trim(),
      notification: values.notification as NotificationKey,
      mjml: values.content,
    };

    let failure: string | undefined;
    try {
      await updater.execute({
        draft: {
          container: TEMPLATE_PARTS_CONTAINER,
          key: part.key,
          value: JSON.stringify(partValue(part)),
        },
        onError(message?: string) {
          failure = message ?? 'Unknown error';
        },
      });
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
    }
    if (failure !== undefined) {
      notify(
        'error',
        intl.formatMessage(messages.partSaveError, { message: failure })
      );
      return;
    }

    const parts = [
      ...library.parts.filter((existing) => existing.key !== part.key),
      part,
    ];
    const ids = templatesUsingPart(
      part.key,
      parts,
      [...library.mjmlById].map(([id, mjml]) => ({ id, mjml }))
    );
    const result =
      ids.length > 0
        ? await republishTemplates({
            ids,
            mjmlById: library.mjmlById,
            parts,
            api,
            compile: await loadMjml(),
          })
        : { updated: [], failed: [] };

    if (result.failed.length > 0) {
      notify(
        'error',
        intl.formatMessage(messages.partRepublishError, {
          count: result.failed.length,
          details: result.failed
            .map(
              ({ id, message }) =>
                `${library.nameById.get(id) ?? id}: ${message}`
            )
            .join('; '),
        })
      );
    } else {
      notify(
        'success',
        intl.formatMessage(messages.partSaveSuccess, {
          count: result.updated.length,
        })
      );
    }
    onSaved();
  };
};
