import { type FC, useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import {
  Alert,
  FormField,
  LoadingSpinner,
  Select,
  Stack,
  TextInputField,
} from '@commercetools/nimbus';
import type { Channel } from '../../shared/notifications/keys';
import type { TemplateSummary } from '../../api/template-api';
import { useAsync } from '../../hooks/use-template-api/use-async';
import { useTemplateApi } from '../../hooks/use-template-api/use-template-api';
import messages from './messages';

type Props = {
  channel: Channel;
  value: string;
  onChange: (templateId: string) => void;
  onBlur: () => void;
  isDisabled: boolean;
  /** Already translated; shown under the field. */
  error?: string;
};

/**
 * One option per SendGrid template of the mapping's type. When the template service is not reachable the
 * merchant can still paste an ID, so a mapping can be saved while the service is being set up.
 */
const TemplatePicker: FC<Props> = ({
  channel,
  value,
  onChange,
  onBlur,
  isDisabled,
  error,
}) => {
  const intl = useIntl();
  const service = useTemplateApi();
  const api = service.status === 'ready' ? service.api : undefined;
  const load = useCallback(
    () => (api ? api.list(channel) : Promise.resolve([])),
    [api, channel]
  );
  const [templates] = useAsync(api ? load : undefined);

  const options = useMemo<TemplateSummary[]>(() => {
    const list = templates.status === 'ready' ? [...templates.data] : [];
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [templates]);

  const label = intl.formatMessage(messages.templateLabel);
  const manual = service.status === 'missing' || service.status === 'error';

  if (manual || templates.status === 'error') {
    return (
      <Stack direction="column" gap="300">
        <Alert.Root colorPalette="warning">
          <Alert.Description>
            {intl.formatMessage(messages.templateServiceUnavailable)}
          </Alert.Description>
        </Alert.Root>
        <TextInputField
          label={intl.formatMessage(messages.sendGridIdLabel)}
          description={intl.formatMessage(messages.sendGridIdHint)}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          isRequired
          isDisabled={isDisabled}
          touched={Boolean(error)}
          errors={error ? { invalid: true } : undefined}
          renderError={() => error}
        />
      </Stack>
    );
  }

  if (service.status === 'loading' || templates.status === 'loading') {
    return (
      <Stack alignItems="center">
        <LoadingSpinner />
      </Stack>
    );
  }

  const known = options.some((option) => option.id === value);
  return (
    <FormField.Root isRequired isDisabled={isDisabled}>
      <FormField.Label>{label}</FormField.Label>
      <FormField.Input>
        <Select.Root
          aria-label={label}
          placeholder="—"
          selectedKey={value || null}
          isDisabled={isDisabled}
          onSelectionChange={(key) => {
            onChange(String(key));
            onBlur();
          }}
        >
          <Select.Options>
            {options.map((option) => (
              <Select.Option key={option.id} id={option.id}>
                {option.name}
              </Select.Option>
            ))}
            {value && !known && (
              <Select.Option key={value} id={value}>
                {intl.formatMessage(messages.templateNotFound, { id: value })}
              </Select.Option>
            )}
          </Select.Options>
        </Select.Root>
      </FormField.Input>
      <FormField.Description>
        {options.length === 0
          ? intl.formatMessage(messages.templatesEmpty, { channel })
          : intl.formatMessage(messages.templateHint)}
      </FormField.Description>
      {error && <FormField.Error>{error}</FormField.Error>}
    </FormField.Root>
  );
};

export default TemplatePicker;
