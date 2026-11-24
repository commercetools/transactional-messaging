import { type FC, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { Route, Switch, useHistory, useRouteMatch } from 'react-router-dom';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { useIsAuthorized } from '@commercetools-frontend/permissions';
import { NO_VALUE_FALLBACK } from '@commercetools-frontend/constants';
import {
  Alert,
  Box,
  Button,
  DataTable,
  type DataTableColumnItem,
  DefaultPage,
  LoadingSpinner,
  Stack,
  Text,
} from '@commercetools/nimbus';
import { Add } from '@commercetools/nimbus-icons';
import {
  NOTIFICATION_KEYS,
  type NotificationKey,
} from '../../shared/notifications/keys';
import {
  MAPPINGS_CONTAINER,
  parseNotificationMapping,
  mappingKey,
  type NotificationMapping,
} from '../../shared/mappings/notification-mapping';
import { PERMISSIONS } from '../../constants';
import { useCustomObjectsFetcher } from '../../hooks/use-custom-object-connector/use-custom-object-connector';
import { useAsync } from '../../hooks/use-template-api/use-async';
import { useTemplateApi } from '../../hooks/use-template-api/use-template-api';
import { getErrorMessage } from '../../helpers';
import messages from './messages';
import MappingCreate from './mapping-create';
import MappingEdit from './mapping-edit';
import { NOTIFICATION_LABELS } from './mapping-helpers';

type Row = {
  id: string;
  objectKey: string;
  mapping?: NotificationMapping;
  lastModifiedAt: string;
};

const MappingList: FC = () => {
  const intl = useIntl();
  const history = useHistory();
  const match = useRouteMatch();
  const canManage = useIsAuthorized({
    demandedPermissions: [PERMISSIONS.Manage],
  });
  const dataLocale = useApplicationContext(
    (context) => context.dataLocale ?? ''
  );
  const { customObjectsPaginatedResult, loading, error, refetch } =
    useCustomObjectsFetcher({
      container: MAPPINGS_CONTAINER,
      limit: 500,
    });

  // Names are a convenience: without the template service the list shows the template IDs.
  const service = useTemplateApi();
  const api = service.status === 'ready' ? service.api : undefined;
  const loadTemplates = useCallback(
    () => (api ? api.list() : Promise.resolve([])),
    [api]
  );
  const [templates] = useAsync(api ? loadTemplates : undefined);
  const templateNames = new Map(
    (templates.status === 'ready' ? templates.data : []).map((template) => [
      template.id,
      template.name,
    ])
  );

  const rows: Row[] = (customObjectsPaginatedResult?.results ?? []).map(
    (object) => ({
      id: object.id,
      objectKey: object.key,
      mapping: parseNotificationMapping(object.value),
      lastModifiedAt: object.lastModifiedAt,
    })
  );
  const mappingsByKey = new Map(
    rows
      .filter((row) => row.mapping)
      .map((row) => [row.objectKey, row.mapping as NotificationMapping])
  );

  const statusOf = (row: Row) => {
    if (!row.mapping) return intl.formatMessage(messages.statusInvalid);
    return row.mapping.enabled
      ? intl.formatMessage(messages.statusEnabled)
      : intl.formatMessage(messages.statusDisabled);
  };

  const detailsOf = (row: Row) => {
    if (!row.mapping) return NO_VALUE_FALLBACK;
    return templateNames.get(row.mapping.templateId) ?? row.mapping.templateId;
  };

  const columns: DataTableColumnItem<Row>[] = [
    {
      id: 'notification',
      header: intl.formatMessage(messages.columnNotification),
      accessor: (row) =>
        row.mapping
          ? intl.formatMessage(NOTIFICATION_LABELS[row.mapping.notification])
          : row.objectKey,
    },
    {
      id: 'channel',
      header: intl.formatMessage(messages.columnType),
      accessor: (row) =>
        row.mapping?.channel === 'sms'
          ? intl.formatMessage(messages.typeSms)
          : row.mapping
          ? intl.formatMessage(messages.typeEmail)
          : NO_VALUE_FALLBACK,
    },
    {
      id: 'status',
      header: intl.formatMessage(messages.columnStatus),
      accessor: statusOf,
    },
    {
      id: 'details',
      header: intl.formatMessage(messages.columnDetails),
      accessor: detailsOf,
    },
    {
      id: 'lastModifiedAt',
      header: intl.formatMessage(messages.columnModified),
      accessor: (row) =>
        new Date(row.lastModifiedAt).toLocaleString(dataLocale || undefined),
    },
  ];

  const closeAndRefresh = () => {
    void refetch();
    history.push(match.url);
  };

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
          {error && (
            <Alert.Root colorPalette="critical">
              <Alert.Description>{getErrorMessage(error)}</Alert.Description>
            </Alert.Root>
          )}
          {loading && (
            <Stack alignItems="center">
              <LoadingSpinner />
            </Stack>
          )}
          {!loading && !error && rows.length === 0 && (
            <Alert.Root colorPalette="info">
              <Alert.Description>
                {intl.formatMessage(messages.emptyState)}
              </Alert.Description>
            </Alert.Root>
          )}
          {!loading && !error && rows.length > 0 && (
            <Box>
              <DataTable
                columns={columns}
                rows={rows}
                allowsPinning={false}
                onRowAction={(row) => history.push(`${match.url}/${row.id}`)}
              />
            </Box>
          )}
          {!loading && !error && (
            <Stack direction="column" gap="200">
              <Text fontWeight="bold">
                {intl.formatMessage(messages.coverageTitle)}
              </Text>
              {NOTIFICATION_KEYS.map((key: NotificationKey) => {
                const hasEmail = mappingsByKey.has(mappingKey(key, 'email'));
                const hasSms = mappingsByKey.has(mappingKey(key, 'sms'));
                return (
                  <Text key={key} fontSize="sm">
                    {`${intl.formatMessage(
                      NOTIFICATION_LABELS[key]
                    )}: ${intl.formatMessage(messages.coverageEmail)} ${
                      hasEmail ? '✓' : '–'
                    } · ${intl.formatMessage(messages.coverageSms)} ${
                      hasSms ? '✓' : '–'
                    }`}
                  </Text>
                );
              })}
            </Stack>
          )}
        </Stack>
        <Switch>
          <Route path={`${match.path}/new`}>
            <MappingCreate
              existingKeys={[...mappingsByKey.keys()]}
              onClose={closeAndRefresh}
            />
          </Route>
          <Route path={`${match.path}/:id`}>
            <MappingEdit onClose={closeAndRefresh} />
          </Route>
        </Switch>
      </DefaultPage.Content>
    </DefaultPage.Root>
  );
};

export default MappingList;
