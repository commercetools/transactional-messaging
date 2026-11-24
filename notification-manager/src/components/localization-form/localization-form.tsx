import { type FC } from 'react';
import { useFormik } from 'formik';
import { useIntl } from 'react-intl';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import {
  Box,
  Button,
  IconButton,
  LocalizedField,
  type LocalizedFieldChangeEvent,
  ModalPage,
  SimpleGrid,
  Stack,
  Text,
  TextInputField,
} from '@commercetools/nimbus';
import { Add, Delete } from '@commercetools/nimbus-icons';
import { Localizations } from '../../types';
import { createLocalizedString } from '../../utils/localized-string';
import messages from './messages';

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
                          <TextInputField
                            label={intl.formatMessage(messages.entryKeyTitle)}
                            value={entry.key}
                            onChange={(value: string) => {
                              void formik.setFieldValue(
                                `entries.${entryIndex}.key`,
                                value
                              );
                            }}
                            isDisabled={readOnly}
                          />
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
                  isDisabled={readOnly}
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
