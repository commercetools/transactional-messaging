import { type FC } from 'react';
import { useFormik } from 'formik';
import { useIntl } from 'react-intl';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import {
  Box,
  Button,
  FormField,
  IconButton,
  LocalizedField,
  type LocalizedFieldChangeEvent,
  ModalPage,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInputField,
} from '@commercetools/nimbus';
import { Add, Delete } from '@commercetools/nimbus-icons';
import { Localizations } from '../../types';
import { createLocalizedString } from '../../utils/localized-string';
import { NOTIFICATION_KEYS } from '../../shared/notifications/keys';
import { MESSAGE_TYPE } from '../../templates/variables';
import { NOTIFICATION_LABELS } from '../mappings/mapping-helpers';
import messages from './messages';

const MESSAGE_TYPES = [...new Set(Object.values(MESSAGE_TYPE))];

export const KEY_PATTERN = /^[a-zA-Z0-9-_]+$/;

type FormErrors = { key?: string; name?: string };

export const validateKey = (key: string | undefined): string | undefined => {
  if (!key || key.trim().length === 0) return 'missing';
  const trimmed = key.trim();
  if (trimmed.length < 2 || trimmed.length > 256 || !KEY_PATTERN.test(trimmed))
    return 'invalid';
  return undefined;
};

type Props = {
  mode: 'create' | 'edit';
  initialValues: Localizations;
  canManage: boolean;
  onSubmit: (values: Localizations) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
  title: string;
};

const LocalizationForm: FC<Props> = ({
  mode,
  initialValues,
  canManage,
  onSubmit,
  onDelete,
  onClose,
  title,
}) => {
  const intl = useIntl();
  /** "OrderCreated · Order confirmation": the type and the notifications that read its texts. */
  const notificationsOf = (type: string): string =>
    NOTIFICATION_KEYS.filter((key) => MESSAGE_TYPE[key] === type)
      .map((key) => intl.formatMessage(NOTIFICATION_LABELS[key]))
      .join(', ');
  const { dataLocale, projectLanguages } = useApplicationContext((context) => ({
    dataLocale: context.dataLocale ?? '',
    projectLanguages: context.project?.languages ?? [],
  }));

  const formik = useFormik<Localizations>({
    initialValues: {
      ...initialValues,
      name: createLocalizedString(projectLanguages, initialValues.name),
      entries: initialValues.entries ?? [],
    },
    validate: (values) => {
      const errors: FormErrors = {};
      const keyProblem = validateKey(values.key);
      if (keyProblem === 'missing')
        errors.key = intl.formatMessage(messages.keyRequired);
      if (keyProblem === 'invalid')
        errors.key = intl.formatMessage(messages.keyInvalid);
      const hasName = Object.values(values.name ?? {}).some(
        (text) => text.trim().length > 0
      );
      if (!hasName) errors.name = intl.formatMessage(messages.nameRequired);
      return errors;
    },
    onSubmit: async (values) => {
      await onSubmit(values);
    },
  });

  const readOnly = !canManage;
  const entries = formik.values.entries ?? [];
  /**
   * The known message types that no other group uses yet. A type the group already has stays listed even if
   * it is not a known one, so older data is shown as it is.
   */
  const typeOptions = (entryIndex: number): string[] => {
    const taken = new Set(
      entries
        .filter((_, index) => index !== entryIndex)
        .map((entry) => entry.key)
    );
    const own = entries[entryIndex]?.key;
    const options = MESSAGE_TYPES.filter((type) => !taken.has(type));
    return own && !options.includes(own) ? [own, ...options] : options;
  };
  const allTypesUsed = MESSAGE_TYPES.every((type) =>
    entries.some((entry) => entry.key === type)
  );

  const addEntry = () =>
    formik.setFieldValue('entries', [
      ...entries,
      { key: '', name: createLocalizedString(projectLanguages), values: [] },
    ]);

  const removeEntry = (index: number) =>
    formik.setFieldValue(
      'entries',
      entries.filter((_, position) => position !== index)
    );

  const addValue = (entryIndex: number) =>
    formik.setFieldValue(`entries.${entryIndex}.values`, [
      ...(entries[entryIndex].values ?? []),
      { key: '', label: createLocalizedString(projectLanguages) },
    ]);

  const removeValue = (entryIndex: number, valueIndex: number) =>
    formik.setFieldValue(
      `entries.${entryIndex}.values`,
      (entries[entryIndex].values ?? []).filter(
        (_, position) => position !== valueIndex
      )
    );

  const localizedChange =
    (path: string) =>
    (event: LocalizedFieldChangeEvent): void => {
      void formik.setFieldValue(
        `${path}.${event.target.locale}`,
        String(event.target.value ?? '')
      );
    };

  return (
    <ModalPage.Root isOpen onClose={onClose}>
      <ModalPage.TopBar
        previousPathLabel={intl.formatMessage(messages.cancel)}
        currentPathLabel={title}
      />
      <ModalPage.Header>
        <ModalPage.Title>{title}</ModalPage.Title>
      </ModalPage.Header>
      <ModalPage.Content>
        <form onSubmit={formik.handleSubmit} noValidate>
          <Stack direction="column" gap="600">
            {readOnly && (
              <Text>{intl.formatMessage(messages.readOnlyNotice)}</Text>
            )}

            <TextInputField
              label={intl.formatMessage(messages.keyTitle)}
              description={intl.formatMessage(messages.keyHint)}
              value={formik.values.key}
              onChange={(value: string) => {
                void formik.setFieldValue('key', value);
              }}
              onBlur={() => {
                void formik.setFieldTouched('key', true);
              }}
              isRequired
              isDisabled={mode === 'edit' || readOnly}
              touched={Boolean(formik.touched.key)}
              errors={
                formik.errors.key ? { [formik.errors.key]: true } : undefined
              }
              renderError={(errorKey: string) => errorKey}
            />

            <LocalizedField
              type="text"
              label={intl.formatMessage(messages.nameTitle)}
              description={intl.formatMessage(messages.nameHint)}
              defaultLocaleOrCurrency={dataLocale}
              valuesByLocaleOrCurrency={formik.values.name ?? {}}
              onChange={localizedChange('name')}
              isDisabled={readOnly}
              isRequired
              error={formik.touched.name ? formik.errors.name : undefined}
              width="100%"
            />

            <Stack direction="column" gap="400">
              <Text fontWeight="bold">
                {intl.formatMessage(messages.entriesTitle)}
              </Text>
              <Text fontSize="sm" color="neutral.11">
                {intl.formatMessage(messages.entriesHint)}
              </Text>
              <SimpleGrid columns={{ base: 1, xl: 2 }} gap="600">
                {entries.map((entry, entryIndex) => (
                  <Box
                    key={entryIndex}
                    border="solid-25"
                    borderColor="neutral.6"
                    borderRadius="200"
                    padding="400"
                  >
                    <Stack direction="column" gap="400">
                      <Stack direction="row" gap="400" alignItems="flex-end">
                        <Box flex="1">
                          <FormField.Root isRequired isDisabled={readOnly}>
                            <FormField.Label>
                              {intl.formatMessage(messages.entryKeyTitle)}
                            </FormField.Label>
                            <FormField.Input>
                              <Select.Root
                                aria-label={intl.formatMessage(
                                  messages.entryKeyTitle
                                )}
                                placeholder="—"
                                selectedKey={entry.key || null}
                                isDisabled={readOnly}
                                onSelectionChange={(key) => {
                                  void formik.setFieldValue(
                                    `entries.${entryIndex}.key`,
                                    String(key)
                                  );
                                }}
                              >
                                <Select.Options>
                                  {typeOptions(entryIndex).map((type) => (
                                    <Select.Option key={type} id={type}>
                                      {notificationsOf(type)
                                        ? `${type} · ${notificationsOf(type)}`
                                        : type}
                                    </Select.Option>
                                  ))}
                                </Select.Options>
                              </Select.Root>
                            </FormField.Input>
                            {entry.key && !notificationsOf(entry.key) && (
                              <FormField.Description>
                                {intl.formatMessage(messages.entryKeyUnused)}
                              </FormField.Description>
                            )}
                          </FormField.Root>
                        </Box>
                        <IconButton
                          variant="ghost"
                          aria-label={intl.formatMessage(messages.deleteEntry)}
                          isDisabled={readOnly}
                          onPress={() => removeEntry(entryIndex)}
                        >
                          <Delete />
                        </IconButton>
                      </Stack>

                      <LocalizedField
                        type="text"
                        label={intl.formatMessage(messages.entryNameTitle)}
                        description={intl.formatMessage(messages.entryNameHint)}
                        defaultLocaleOrCurrency={dataLocale}
                        valuesByLocaleOrCurrency={entry.name ?? {}}
                        onChange={localizedChange(`entries.${entryIndex}.name`)}
                        isDisabled={readOnly}
                        width="100%"
                      />

                      {(entry.values ?? []).map((value, valueIndex) => (
                        <Stack
                          key={valueIndex}
                          direction="row"
                          gap="400"
                          alignItems="flex-start"
                        >
                          <Box flex="1">
                            <TextInputField
                              label={intl.formatMessage(messages.valueKeyTitle)}
                              description={intl.formatMessage(
                                messages.valueKeyHint,
                                {
                                  token: `{{messages.${
                                    value.key || '<name>'
                                  }}}`,
                                }
                              )}
                              value={value.key}
                              onChange={(next: string) => {
                                void formik.setFieldValue(
                                  `entries.${entryIndex}.values.${valueIndex}.key`,
                                  next
                                );
                              }}
                              isDisabled={readOnly}
                            />
                          </Box>
                          <Box flex="2">
                            <LocalizedField
                              type="text"
                              label={intl.formatMessage(
                                messages.valueLabelTitle
                              )}
                              defaultLocaleOrCurrency={dataLocale}
                              valuesByLocaleOrCurrency={value.label ?? {}}
                              onChange={localizedChange(
                                `entries.${entryIndex}.values.${valueIndex}.label`
                              )}
                              isDisabled={readOnly}
                              width="100%"
                            />
                          </Box>
                          <IconButton
                            variant="ghost"
                            aria-label={intl.formatMessage(
                              messages.deleteValue
                            )}
                            isDisabled={readOnly}
                            onPress={() => removeValue(entryIndex, valueIndex)}
                          >
                            <Delete />
                          </IconButton>
                        </Stack>
                      ))}

                      <Box>
                        <Button
                          variant="outline"
                          isDisabled={readOnly}
                          onPress={() => addValue(entryIndex)}
                        >
                          <Add /> {intl.formatMessage(messages.addValue)}
                        </Button>
                      </Box>
                    </Stack>
                  </Box>
                ))}
              </SimpleGrid>

              <Box>
                <Button
                  variant="outline"
                  isDisabled={readOnly || allTypesUsed}
                  onPress={addEntry}
                >
                  <Add /> {intl.formatMessage(messages.addEntry)}
                </Button>
              </Box>
            </Stack>
          </Stack>
        </form>
      </ModalPage.Content>
      <ModalPage.Footer>
        <Button slot="close" variant="outline">
          {intl.formatMessage(messages.cancel)}
        </Button>
        {mode === 'edit' && onDelete && (
          <Button
            variant="outline"
            colorPalette="critical"
            isDisabled={readOnly}
            onPress={() => void onDelete()}
          >
            {intl.formatMessage(messages.delete)}
          </Button>
        )}
        <Button
          variant="solid"
          colorPalette="primary"
          isDisabled={readOnly || formik.isSubmitting || !formik.dirty}
          onPress={() => void formik.submitForm()}
        >
          {intl.formatMessage(messages.save)}
        </Button>
      </ModalPage.Footer>
    </ModalPage.Root>
  );
};

export default LocalizationForm;
