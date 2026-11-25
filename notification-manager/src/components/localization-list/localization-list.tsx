import { type FC } from 'react';
import { useIntl } from 'react-intl';
import { Route, Switch, useHistory, useRouteMatch } from 'react-router-dom';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { useIsAuthorized } from '@commercetools-frontend/permissions';
import { NO_VALUE_FALLBACK } from '@commercetools-frontend/constants';
import { formatLocalizedString } from '@commercetools-frontend/l10n';
import {
  Alert,
  Box,
  Button,
  DataTable,
  type DataTableColumnItem,
  DefaultPage,
  LoadingSpinner,
  Stack,
} from '@commercetools/nimbus';
import { Add } from '@commercetools/nimbus-icons';
import { PERMISSIONS, CONTAINER_KEY, LOCALIZATIONS_KEY } from '../../constants';
import { useCustomObjectsFetcher } from '../../hooks/use-custom-object-connector/use-custom-object-connector';
import { TCustomObject } from '../../types/generated/ctp';
import { castValue, getErrorMessage } from '../../helpers';
import LocalizationCreate from '../localization-create/localization-create';
import LocalizationEdit from '../localization-edit/localization-edit';
import messages from './messages';

const LocalizationList: FC = () => {
  const intl = useIntl();
  const history = useHistory();
  const match = useRouteMatch();
  const canManage = useIsAuthorized({
    demandedPermissions: [PERMISSIONS.Manage],
  });
  const { projectLanguages, dataLocale } = useApplicationContext((context) => ({
    projectLanguages: context.project?.languages ?? [],
    dataLocale: context.dataLocale ?? '',
  }));
  const { customObjectsPaginatedResult, loading, error, refetch } =
    useCustomObjectsFetcher({
      container: CONTAINER_KEY,
    });

  const rows = customObjectsPaginatedResult?.results ?? [];

  const columns: DataTableColumnItem<TCustomObject>[] = [
    {
      id: 'key',
      header: intl.formatMessage(messages.columnKey),
      accessor: (row) => row.key,
    },
    {
      id: 'name',
      header: intl.formatMessage(messages.columnName),
      accessor: (row) =>
        formatLocalizedString(
          { name: castValue(row).name },
          {
            key: 'name',
            locale: dataLocale,
            fallbackOrder: projectLanguages,
            fallback: NO_VALUE_FALLBACK,
          }
        ),
    },
    {
      id: 'used',
      header: intl.formatMessage(messages.columnUsed),
      accessor: (row) =>
        intl.formatMessage(
          row.key === LOCALIZATIONS_KEY ? messages.used : messages.unused
        ),
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
          {intl.formatMessage(messages.subTitle, {
            token: '{{messages.<name>}}',
          })}
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
                {intl.formatMessage(messages.missingConfiguration)}
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
        </Stack>
        <Switch>
          <Route path={`${match.path}/new`}>
            <LocalizationCreate onClose={closeAndRefresh} />
          </Route>
          <Route path={`${match.path}/:id`}>
            <LocalizationEdit onClose={closeAndRefresh} />
          </Route>
        </Switch>
      </DefaultPage.Content>
    </DefaultPage.Root>
  );
};

export default LocalizationList;
