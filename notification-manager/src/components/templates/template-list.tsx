import { type FC, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Route, Switch, useHistory, useRouteMatch } from 'react-router-dom';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { useIsAuthorized } from '@commercetools-frontend/permissions';
import { useShowNotification } from '@commercetools-frontend/actions-global';
import {
  DOMAINS,
  NO_VALUE_FALLBACK,
  NOTIFICATION_KINDS_SIDE,
} from '@commercetools-frontend/constants';
import {
  Alert,
  Box,
  Button,
  ConfirmationDialog,
  DataTable,
  type DataTableColumnItem,
  DefaultPage,
  LoadingSpinner,
  Stack,
  Text,
} from '@commercetools/nimbus';
import { Add } from '@commercetools/nimbus-icons';
import { MAPPINGS_CONTAINER } from '../../shared/mappings/notification-mapping';
import type { TemplateApi, TemplateSummary } from '../../api/template-api';
import { PERMISSIONS, TEMPLATE_SOURCES_CONTAINER } from '../../constants';
import { getErrorMessage } from '../../helpers';
import { useAsync } from '../../hooks/use-template-api/use-async';
import { useTemplateApi } from '../../hooks/use-template-api/use-template-api';
import {
  useCustomObjectDeleter,
  useCustomObjectsFetcher,
} from '../../hooks/use-custom-object-connector/use-custom-object-connector';
import { parseTemplateSource } from '../../templates/template-source';
import { NOTIFICATION_LABELS } from '../mappings/mapping-helpers';
import messages from './messages';
import { mappedTemplateIds } from './template-helpers';
import TemplateCreate from './template-create';
import TemplateEdit from './template-edit';

type Row = TemplateSummary & { id: string };

const TemplateTable: FC<{ api: TemplateApi }> = ({ api }) => {
  const intl = useIntl();
  const history = useHistory();
  const match = useRouteMatch();
  const showNotification = useShowNotification();
  const canManage = useIsAuthorized({
    demandedPermissions: [PERMISSIONS.Manage],
  });
  const dataLocale = useApplicationContext(
    (context) => context.dataLocale ?? ''
  );
  const load = useCallback(() => api.list(), [api]);
  const [templates, reload] = useAsync(load);
  const sources = useCustomObjectsFetcher({
    container: TEMPLATE_SOURCES_CONTAINER,
    limit: 500,
  });
  const mappings = useCustomObjectsFetcher({
    container: MAPPINGS_CONTAINER,
    limit: 500,
  });
  const deleter = useCustomObjectDeleter();
  const [pendingDelete, setPendingDelete] = useState<Row | undefined>(
    undefined
  );

  const sourceById = useMemo(
    () =>
      new Map(
        (sources.customObjectsPaginatedResult?.results ?? []).map((object) => [
          object.key,
          parseTemplateSource(object.value),
        ])
      ),
    [sources.customObjectsPaginatedResult]
  );
  const usedIds = useMemo(
    () =>
      mappedTemplateIds(mappings.customObjectsPaginatedResult?.results ?? []),
    [mappings.customObjectsPaginatedResult]
  );

  const notify = (kind: 'success' | 'error', text: string) =>
    showNotification({
      kind:
        kind === 'success'
          ? NOTIFICATION_KINDS_SIDE.success
          : NOTIFICATION_KINDS_SIDE.error,
      domain: DOMAINS.SIDE,
      text,
    });

  const closeAndRefresh = () => {
    reload();
    void sources.refetch();
    history.push(match.url);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await api.remove(pendingDelete.id);
    } catch (error) {
      notify(
        'error',
        intl.formatMessage(messages.deleteError, {
          message: (error as Error).message,
        })
      );
      throw error;
    }
    if (sourceById.has(pendingDelete.id)) {
      // The SendGrid template is gone; a leftover source record is harmless, so only report it.
      await deleter
        .execute({
          container: TEMPLATE_SOURCES_CONTAINER,
          key: pendingDelete.id,
        })
        .catch(() => undefined);
    }
    notify('success', intl.formatMessage(messages.deleteSuccess));
    setPendingDelete(undefined);
    reload();
    void sources.refetch();
  };

  const rows: Row[] = templates.status === 'ready' ? templates.data : [];

  const columns: DataTableColumnItem<Row>[] = [
    {
      id: 'name',
      header: intl.formatMessage(messages.columnName),
      accessor: (row) => row.name,
    },
    {
      id: 'channel',
      header: intl.formatMessage(messages.columnType),
      accessor: (row) =>
        intl.formatMessage(
          row.channel === 'sms' ? messages.typeSms : messages.typeEmail
        ),
    },
    {
      id: 'notification',
      header: intl.formatMessage(messages.columnNotification),
      accessor: (row) => {
        const source = sourceById.get(row.id);
        return source
          ? intl.formatMessage(NOTIFICATION_LABELS[source.notification])
          : intl.formatMessage(messages.createdInSendGrid);
      },
    },
    {
      id: 'updatedAt',
      header: intl.formatMessage(messages.columnModified),
      accessor: (row) =>
        row.updatedAt
          ? new Date(row.updatedAt).toLocaleString(dataLocale || undefined)
          : NO_VALUE_FALLBACK,
    },
    {
      id: 'actions',
      header: intl.formatMessage(messages.columnActions),
      accessor: (row) => (
        <Stack direction="row" gap="200">
          <Button
            size="xs"
            variant="outline"
            onPress={() => history.push(`${match.url}/${row.id}`)}
          >
            {intl.formatMessage(
              canManage && sourceById.has(row.id)
                ? messages.edit
                : messages.view
            )}
          </Button>
          {canManage && (
            <Button
              size="xs"
              variant="outline"
              colorPalette="critical"
              onPress={() => setPendingDelete(row)}
            >
              {intl.formatMessage(messages.delete)}
            </Button>
          )}
        </Stack>
      ),
    },
  ];

  const blocked = pendingDelete ? usedIds.has(pendingDelete.id) : false;

  return (
    <DefaultPage.Root>
      <DefaultPage.Header>
        <DefaultPage.Title>
          {intl.formatMessage(messages.title)}
        </DefaultPage.Title>
        <DefaultPage.Subtitle>
          {intl.formatMessage(messages.subTitle)}
        </DefaultPage.Subtitle>
        <DefaultPage.Actions>
          {canManage && (
            <Button
              variant="solid"
              colorPalette="primary"
              onPress={() => history.push(`${match.url}/new`)}
            >
              <Add /> {intl.formatMessage(messages.addButton)}
            </Button>
          )}
        </DefaultPage.Actions>
      </DefaultPage.Header>
      <DefaultPage.Content>
        <Stack direction="column" gap="400">
          {templates.status === 'error' && (
            <Alert.Root colorPalette="critical">
              <Alert.Description>
                {intl.formatMessage(messages.loadError, {
                  message: templates.error.message,
                })}
              </Alert.Description>
            </Alert.Root>
          )}
          {sources.error && (
            <Alert.Root colorPalette="critical">
              <Alert.Description>
                {getErrorMessage(sources.error)}
              </Alert.Description>
            </Alert.Root>
          )}
          {templates.status === 'loading' && (
            <Stack alignItems="center">
              <LoadingSpinner />
            </Stack>
          )}
          {templates.status === 'ready' && rows.length === 0 && (
            <Alert.Root colorPalette="info">
              <Alert.Description>
                {intl.formatMessage(messages.emptyState)}
              </Alert.Description>
            </Alert.Root>
          )}
          {templates.status === 'ready' && rows.length > 0 && (
            <Box>
              <DataTable columns={columns} rows={rows} allowsPinning={false} />
            </Box>
          )}
        </Stack>
        <Switch>
          <Route path={`${match.path}/new`}>
            <TemplateCreate api={api} onClose={closeAndRefresh} />
          </Route>
          <Route path={`${match.path}/:id`}>
            <TemplateEdit api={api} onClose={closeAndRefresh} />
          </Route>
        </Switch>
        <ConfirmationDialog
          title={intl.formatMessage(messages.deleteTitle)}
          intent="destructive"
          confirmLabel={intl.formatMessage(messages.delete)}
          cancelLabel={intl.formatMessage(messages.cancel)}
          isOpen={Boolean(pendingDelete)}
          isConfirmDisabled={blocked}
          onOpenChange={(open) => {
            if (!open) setPendingDelete(undefined);
          }}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(undefined)}
        >
          <Text>
            {intl.formatMessage(
              blocked ? messages.deleteBlocked : messages.deleteBody,
              { name: pendingDelete?.name ?? '' }
            )}
          </Text>
        </ConfirmationDialog>
      </DefaultPage.Content>
    </DefaultPage.Root>
  );
};

/** Waits for the template service to be found, then shows the table. */
const TemplateList: FC = () => {
  const intl = useIntl();
  const service = useTemplateApi();

  if (service.status === 'ready') return <TemplateTable api={service.api} />;
  return (
    <DefaultPage.Root>
      <DefaultPage.Header>
        <DefaultPage.Title>
          {intl.formatMessage(messages.title)}
        </DefaultPage.Title>
      </DefaultPage.Header>
      <DefaultPage.Content>
        {service.status === 'loading' && (
          <Stack alignItems="center">
            <LoadingSpinner />
          </Stack>
        )}
        {service.status === 'missing' && (
          <Alert.Root colorPalette="warning">
            <Alert.Description>
              {intl.formatMessage(messages.serviceMissing)}
            </Alert.Description>
          </Alert.Root>
        )}
        {service.status === 'error' && (
          <Alert.Root colorPalette="critical">
            <Alert.Description>{service.message}</Alert.Description>
          </Alert.Root>
        )}
      </DefaultPage.Content>
    </DefaultPage.Root>
  );
};

export default TemplateList;
