import {
  type FC,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useFormik } from 'formik';
import { useIntl } from 'react-intl';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import {
  Alert,
  Box,
  Button,
  ComboBox,
  FormField,
  ModalPage,
  MultilineTextInput,
  RadioInput,
  Select,
  Splitter,
  Stack,
  Text,
  TextInputField,
} from '@commercetools/nimbus';
import {
  NOTIFICATION_KEYS,
  type Channel,
  type NotificationKey,
} from '../../shared/notifications/keys';
import { SMS_MAX_LENGTH } from '../../shared/sms/render-sms';
import type { Localizations } from '../../types';
import {
  defaultContent,
  DEFAULT_SUBJECT,
  nextOnDefaultChange,
} from '../../templates/defaults';
import { insertAtSelection } from '../../templates/insert';
import {
  DEFAULT_PART_MJML,
  includeTag,
  newPartKey,
  partMap,
  resolveIncludes,
  wrapPart,
  type TemplatePart,
} from '../../templates/parts';
import {
  compileMjml,
  loadMjml,
  previewData,
  renderEmailPreview,
  renderSmsPreview,
  renderSubject,
  type Preview,
} from '../../templates/preview';
import { estimateSms } from '../../templates/sms-segments';
import { allVariables, samplePayload } from '../../templates/variables';
import { NOTIFICATION_LABELS } from '../mappings/mapping-helpers';
import messages from './messages';
import {
  NAME_MAX_LENGTH,
  hasFormErrors,
  validateTemplateForm,
  type TemplateErrorCode,
  type TemplateFormValues,
  type TemplateKind,
} from './template-helpers';

/** A template written in SendGrid's own editor: shown as it is, never edited here. */
export type ExternalTemplate = { subject: string; html: string; text: string };

type Props = {
  mode: 'create' | 'edit';
  title: string;
  initialValues: TemplateFormValues;
  localizations?: Localizations;
  canManage: boolean;
  external?: ExternalTemplate;
  /** Every part, for the part picker and to resolve includes. */
  parts: ReadonlyArray<TemplatePart>;
  /** Set when an existing part is edited. */
  partKey?: string;
  /** How many templates include the part being edited. */
  usageCount?: number;
  onSubmit: (values: TemplateFormValues, html: string) => Promise<void>;
  onClose: () => void;
};

type Compiler = Awaited<ReturnType<typeof loadMjml>>;

const PANE_HEIGHT = '560px';

const TemplateForm: FC<Props> = ({
  mode,
  title,
  initialValues,
  localizations,
  canManage,
  external,
  parts,
  partKey,
  usageCount = 0,
  onSubmit,
  onClose,
}) => {
  const intl = useIntl();
  const dataLocale = useApplicationContext(
    (context) => context.dataLocale ?? ''
  );
  const locale = dataLocale || 'en-US';
  const [compiler, setCompiler] = useState<Compiler | undefined>(undefined);
  const [pickerInput, setPickerInput] = useState('');
  const [partPickerInput, setPartPickerInput] = useState('');
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const selection = useRef<{ start: number; end: number } | undefined>(
    undefined
  );
  const pendingCursor = useRef<number | undefined>(undefined);

  const readOnly = !canManage || Boolean(external);
  const isEdit = mode === 'edit';
  // The part being edited is left out, so including it in itself is reported as a loop.
  const available = useMemo(
    () => partMap(parts.filter((part) => part.key !== partKey)),
    [parts, partKey]
  );

  const formik = useFormik<TemplateFormValues>({
    initialValues,
    onSubmit: async (values) => {
      const mjml = await loadMjml();
      const html =
        values.channel === 'email'
          ? compileMjml(mjml, resolveIncludes(values.content, available).mjml)
              .html ?? ''
          : '';
      await onSubmit(values, html);
    },
  });
  const { values } = formik;
  const errors = validateTemplateForm(
    values,
    values.channel === 'sms' ? undefined : available,
    partKey
  );
  const isPart = values.channel === 'part';

  useEffect(() => {
    let active = true;
    void loadMjml().then((loaded) => {
      if (active) setCompiler(() => loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  // Put the cursor after an inserted variable once the new text is in the editor.
  useEffect(() => {
    const cursor = pendingCursor.current;
    const editor = editorRef.current;
    if (cursor === undefined || !editor) return;
    pendingCursor.current = undefined;
    editor.focus();
    editor.setSelectionRange(cursor, cursor);
  }, [values.content]);

  const notification = values.notification || undefined;
  const variables = useMemo(
    () => (notification ? allVariables(notification, localizations) : []),
    [notification, localizations]
  );
  const variablesById = useMemo(
    () => new Map(variables.map((variable) => [variable.id, variable])),
    [variables]
  );
  const pickerItems = useMemo(
    () =>
      variables.map((variable) => ({ id: variable.id, name: variable.label })),
    [variables]
  );

  const partItems = useMemo(
    () =>
      parts
        .filter(
          (part) => part.notification === notification && part.key !== partKey
        )
        .map((part) => ({ id: part.key, name: part.name })),
    [parts, notification, partKey]
  );
  const includePath = isPart
    ? partKey ??
      newPartKey(
        values.name,
        parts.map((part) => part.key)
      )
    : undefined;

  const data = useMemo(
    () =>
      notification
        ? previewData(notification, localizations, locale)
        : undefined,
    [notification, localizations, locale]
  );
  const deferredContent = useDeferredValue(values.content);
  const deferredSubject = useDeferredValue(values.subject);

  const preview: Preview | undefined = useMemo(() => {
    if (!data) return undefined;
    if (values.channel === 'sms')
      return renderSmsPreview(deferredContent, data);
    if (!compiler) return undefined;
    const resolved = resolveIncludes(deferredContent, available, partKey);
    if (resolved.errors.length > 0) return { errors: resolved.errors };
    return renderEmailPreview(
      compiler,
      values.channel === 'part' ? wrapPart(resolved.mjml) : resolved.mjml,
      data
    );
  }, [data, compiler, deferredContent, values.channel, available, partKey]);

  const insertToken = (token: string) => {
    const editor = editorRef.current;
    const at = selection.current ?? {
      start: editor?.selectionStart ?? values.content.length,
      end: editor?.selectionEnd ?? values.content.length,
    };
    const result = insertAtSelection(values.content, at.start, at.end, token);
    pendingCursor.current = result.cursor;
    selection.current = { start: result.cursor, end: result.cursor };
    void formik.setFieldValue('content', result.value);
  };

  const defaultFor = (key: NotificationKey, kind: TemplateKind): string =>
    kind === 'part' ? DEFAULT_PART_MJML : defaultContent(key, kind as Channel);

  const changeDefaults = (next: {
    notification?: NotificationKey;
    channel?: TemplateKind;
  }) => {
    const channel = next.channel ?? values.channel;
    const target = next.notification ?? (values.notification || undefined);
    const previousNotification = values.notification || undefined;
    void formik.setValues({
      ...values,
      channel,
      notification: target ?? '',
      content: target
        ? nextOnDefaultChange({
            current: values.content,
            previousDefault: previousNotification
              ? defaultFor(previousNotification, values.channel)
              : undefined,
            nextDefault: defaultFor(target, channel),
          })
        : values.content,
      subject:
        channel === 'email' && target
          ? nextOnDefaultChange({
              current: values.subject,
              previousDefault: previousNotification
                ? DEFAULT_SUBJECT[previousNotification]
                : undefined,
              nextDefault: DEFAULT_SUBJECT[target],
            })
          : '',
    });
  };

  const errorText = (code?: TemplateErrorCode) => {
    switch (code) {
      case 'required':
        return intl.formatMessage(messages.errorRequired);
      case 'nameTooLong':
        return intl.formatMessage(messages.errorName, { max: NAME_MAX_LENGTH });
      case 'invalidTemplate':
        return intl.formatMessage(messages.errorTemplate, {
          detail: errors.detail ?? '',
        });
      case 'smsTooLong':
        return intl.formatMessage(messages.errorSmsTooLong, {
          max: SMS_MAX_LENGTH,
        });
      default:
        return undefined;
    }
  };

  const estimate = estimateSms(values.content);
  const previewErrors = preview?.errors ?? [];
  const subjectPreview =
    data && values.channel === 'email'
      ? renderSubject(deferredSubject, data)
      : undefined;

  const renderPreviewBody = () => {
    if (external) {
      return external.html ? (
        <iframe
          title={intl.formatMessage(messages.previewLabel)}
          sandbox=""
          srcDoc={external.html}
          style={{
            width: '100%',
            height: '100%',
            border: 0,
            background: '#fff',
          }}
        />
      ) : (
        <Text whiteSpace="pre-wrap">{external.text}</Text>
      );
    }
    if (!notification) {
      return (
        <Text>{intl.formatMessage(messages.previewNeedsNotification)}</Text>
      );
    }
    if (!preview)
      return <Text>{intl.formatMessage(messages.previewLoading)}</Text>;
    if (preview.output === undefined) {
      return (
        <Alert.Root colorPalette="critical">
          <Alert.Description>{previewErrors.join('\n')}</Alert.Description>
        </Alert.Root>
      );
    }
    return values.channel !== 'sms' ? (
      <iframe
        title={intl.formatMessage(messages.previewLabel)}
        sandbox=""
        srcDoc={preview.output}
        style={{ width: '100%', height: '100%', border: 0, background: '#fff' }}
      />
    ) : (
      <Text whiteSpace="pre-wrap">{preview.output}</Text>
    );
  };

  return (
    <ModalPage.Root isOpen onClose={onClose} width="full">
      <ModalPage.TopBar
        previousPathLabel={intl.formatMessage(messages.cancel)}
        currentPathLabel={title}
      />
      <ModalPage.Header>
        <ModalPage.Title>{title}</ModalPage.Title>
      </ModalPage.Header>
      <ModalPage.Content>
        <form id="template-form" onSubmit={formik.handleSubmit} noValidate>
          <Stack direction="column" gap="600">
            {!canManage && (
              <Alert.Root colorPalette="info">
                <Alert.Description>
                  {intl.formatMessage(messages.readOnlyNotice)}
                </Alert.Description>
              </Alert.Root>
            )}
            {usageCount > 0 && (
              <Alert.Root colorPalette="info">
                <Alert.Description>
                  {intl.formatMessage(messages.partUsageNotice, {
                    count: usageCount,
                  })}
                </Alert.Description>
              </Alert.Root>
            )}
            {external && (
              <Alert.Root colorPalette="info">
                <Alert.Description>
                  {intl.formatMessage(messages.externalNotice)}
                </Alert.Description>
              </Alert.Root>
            )}

            <Stack
              direction="row"
              gap="600"
              alignItems="flex-start"
              flexWrap="wrap"
            >
              <Box flex="1" minWidth="280px">
                <TextInputField
                  label={intl.formatMessage(messages.nameLabel)}
                  value={values.name}
                  onChange={(value: string) =>
                    void formik.setFieldValue('name', value)
                  }
                  onBlur={() => void formik.setFieldTouched('name', true)}
                  isRequired
                  isDisabled={readOnly}
                  touched={Boolean(formik.touched.name)}
                  errors={errors.name ? { [errors.name]: true } : undefined}
                  renderError={(key: string) =>
                    errorText(key as TemplateErrorCode)
                  }
                />
              </Box>
              <FormField.Root isDisabled={isEdit || readOnly}>
                <FormField.Label>
                  {intl.formatMessage(messages.typeLabel)}
                </FormField.Label>
                <FormField.Input>
                  <RadioInput.Root
                    name="template-channel"
                    orientation="horizontal"
                    aria-label={intl.formatMessage(messages.typeLabel)}
                    value={values.channel}
                    isDisabled={isEdit || readOnly}
                    onChange={(value: string) =>
                      changeDefaults({ channel: value as TemplateKind })
                    }
                  >
                    <RadioInput.Option value="email">
                      {intl.formatMessage(messages.typeEmail)}
                    </RadioInput.Option>
                    <RadioInput.Option value="sms">
                      {intl.formatMessage(messages.typeSms)}
                    </RadioInput.Option>
                    <RadioInput.Option value="part">
                      {intl.formatMessage(messages.typePart)}
                    </RadioInput.Option>
                  </RadioInput.Root>
                </FormField.Input>
              </FormField.Root>
              <Box flex="1" minWidth="280px">
                <FormField.Root isRequired isDisabled={readOnly}>
                  <FormField.Label>
                    {intl.formatMessage(messages.notificationLabel)}
                  </FormField.Label>
                  <FormField.Input>
                    <Select.Root
                      aria-label={intl.formatMessage(
                        messages.notificationLabel
                      )}
                      placeholder="—"
                      selectedKey={values.notification || null}
                      isDisabled={readOnly}
                      onSelectionChange={(key) =>
                        changeDefaults({
                          notification: String(key) as NotificationKey,
                        })
                      }
                    >
                      <Select.Options>
                        {NOTIFICATION_KEYS.map((key: NotificationKey) => (
                          <Select.Option key={key} id={key}>
                            {intl.formatMessage(NOTIFICATION_LABELS[key])}
                          </Select.Option>
                        ))}
                      </Select.Options>
                    </Select.Root>
                  </FormField.Input>
                  <FormField.Description>
                    {intl.formatMessage(messages.notificationHint)}
                  </FormField.Description>
                  {formik.touched.notification && errors.notification && (
                    <FormField.Error>
                      {errorText(errors.notification)}
                    </FormField.Error>
                  )}
                </FormField.Root>
              </Box>
            </Stack>

            {values.channel !== 'sms' && !external && (
              <TextInputField
                label={intl.formatMessage(messages.subjectLabel)}
                value={values.subject}
                onChange={(value: string) =>
                  void formik.setFieldValue('subject', value)
                }
                onBlur={() => void formik.setFieldTouched('subject', true)}
                isRequired={!isPart}
                isDisabled={readOnly || isPart}
                description={
                  isPart
                    ? intl.formatMessage(messages.subjectPartHint)
                    : undefined
                }
                touched={Boolean(formik.touched.subject)}
                errors={errors.subject ? { [errors.subject]: true } : undefined}
                renderError={(key: string) =>
                  errorText(key as TemplateErrorCode)
                }
              />
            )}

            <Box
              height={PANE_HEIGHT}
              width="100%"
              border="solid-25"
              borderColor="neutral.6"
              borderRadius="200"
              overflow="hidden"
            >
              <Splitter.Root defaultSize={50} minSize={25} maxSize={75}>
                <Splitter.Aside>
                  <Stack
                    direction="column"
                    gap="300"
                    padding="400"
                    height="100%"
                  >
                    <Text fontWeight="bold">
                      {intl.formatMessage(
                        values.channel === 'sms'
                          ? messages.editorLabelSms
                          : messages.editorLabelEmail
                      )}
                    </Text>
                    {includePath && !external && (
                      <Text fontSize="sm" color="neutral.11">
                        {intl.formatMessage(messages.partIncludeHint, {
                          tag: includeTag(includePath),
                        })}
                      </Text>
                    )}
                    {!external && (
                      <Stack direction="row" gap="300" flexWrap="wrap">
                        <Box flex="1" minWidth="200px">
                          <ComboBox.Root
                            items={pickerItems}
                            inputValue={pickerInput}
                            onInputChange={setPickerInput}
                            selectedKeys={[]}
                            selectionMode="single"
                            isDisabled={readOnly || !notification}
                            placeholder={intl.formatMessage(
                              messages.variablePlaceholder
                            )}
                            aria-label={intl.formatMessage(
                              messages.variableLabel
                            )}
                            onSelectionChange={(keys: Iterable<unknown>) => {
                              const id = Array.from(keys)[0];
                              const variable = variablesById.get(String(id));
                              if (variable) insertToken(variable.token);
                              // Reset, so the same variable can be picked again.
                              setPickerInput('');
                            }}
                          >
                            <ComboBox.Trigger />
                            <ComboBox.Popover>
                              <ComboBox.ListBox>
                                {(item: { id: string; name: string }) => (
                                  <ComboBox.Option id={item.id}>
                                    {item.name}
                                  </ComboBox.Option>
                                )}
                              </ComboBox.ListBox>
                            </ComboBox.Popover>
                          </ComboBox.Root>
                        </Box>
                        {values.channel !== 'sms' && (
                          <Box flex="1" minWidth="200px">
                            <ComboBox.Root
                              items={partItems}
                              inputValue={partPickerInput}
                              onInputChange={setPartPickerInput}
                              selectedKeys={[]}
                              selectionMode="single"
                              isDisabled={
                                readOnly ||
                                !notification ||
                                partItems.length === 0
                              }
                              placeholder={intl.formatMessage(
                                notification && partItems.length === 0
                                  ? messages.partPickerEmpty
                                  : messages.partPlaceholder
                              )}
                              aria-label={intl.formatMessage(
                                messages.partLabel
                              )}
                              onSelectionChange={(keys: Iterable<unknown>) => {
                                const key = Array.from(keys)[0];
                                if (key !== undefined)
                                  insertToken(includeTag(String(key)));
                                setPartPickerInput('');
                              }}
                            >
                              <ComboBox.Trigger />
                              <ComboBox.Popover>
                                <ComboBox.ListBox>
                                  {(item: { id: string; name: string }) => (
                                    <ComboBox.Option id={item.id}>
                                      {item.name}
                                    </ComboBox.Option>
                                  )}
                                </ComboBox.ListBox>
                              </ComboBox.Popover>
                            </ComboBox.Root>
                          </Box>
                        )}
                      </Stack>
                    )}
                    {!external && (
                      <MultilineTextInput
                        ref={editorRef}
                        aria-label={intl.formatMessage(
                          values.channel === 'sms'
                            ? messages.editorLabelSms
                            : messages.editorLabelEmail
                        )}
                        value={values.content}
                        isReadOnly={readOnly}
                        isInvalid={
                          Boolean(errors.content) &&
                          Boolean(formik.touched.content)
                        }
                        rows={values.channel === 'sms' ? 8 : 22}
                        fontFamily="mono"
                        fontSize="sm"
                        spellCheck="false"
                        onChange={(value: string) =>
                          void formik.setFieldValue('content', value)
                        }
                        onBlur={() => {
                          void formik.setFieldTouched('content', true);
                          const editor = editorRef.current;
                          if (editor) {
                            selection.current = {
                              start: editor.selectionStart,
                              end: editor.selectionEnd,
                            };
                          }
                        }}
                      />
                    )}
                    {errors.content && formik.touched.content && (
                      <Text color="critical.11" fontSize="sm">
                        {errorText(errors.content)}
                      </Text>
                    )}
                    {values.channel === 'sms' && !external && (
                      <Text
                        fontSize="sm"
                        color={
                          estimate.length > SMS_MAX_LENGTH
                            ? 'critical.11'
                            : 'neutral.11'
                        }
                      >
                        {intl.formatMessage(messages.smsCount, {
                          count: estimate.length,
                          max: SMS_MAX_LENGTH,
                          segments: estimate.segments,
                          encoding: estimate.encoding,
                        })}
                      </Text>
                    )}
                  </Stack>
                </Splitter.Aside>
                <Splitter.Handle />
                <Splitter.Main>
                  <Stack
                    direction="column"
                    gap="300"
                    padding="400"
                    height="100%"
                  >
                    <Text fontWeight="bold">
                      {intl.formatMessage(messages.previewLabel)}
                    </Text>
                    {(subjectPreview ?? external?.subject) && (
                      <Text fontSize="sm">
                        {intl.formatMessage(messages.previewSubject, {
                          subject: subjectPreview ?? external?.subject ?? '',
                        })}
                      </Text>
                    )}
                    {previewErrors.length > 0 &&
                      preview?.output !== undefined && (
                        <Alert.Root colorPalette="warning">
                          <Alert.Description>
                            {previewErrors.join('\n')}
                          </Alert.Description>
                        </Alert.Root>
                      )}
                    <Box flex="1" minHeight="0" overflow="auto">
                      {renderPreviewBody()}
                    </Box>
                  </Stack>
                </Splitter.Main>
              </Splitter.Root>
            </Box>

            {notification && (
              <Stack direction="column" gap="200">
                <Text fontWeight="bold">
                  {intl.formatMessage(messages.payloadTitle)}
                </Text>
                <Text fontSize="sm" color="neutral.11">
                  {intl.formatMessage(messages.payloadHint)}
                </Text>
                <Box
                  as="pre"
                  fontFamily="mono"
                  fontSize="sm"
                  overflow="auto"
                  maxHeight="400px"
                  padding="400"
                  bg="neutral.2"
                  borderRadius="200"
                >
                  {samplePayload(notification)}
                </Box>
              </Stack>
            )}
          </Stack>
        </form>
      </ModalPage.Content>
      <ModalPage.Footer>
        <Button slot="close" variant="outline">
          {intl.formatMessage(messages.cancel)}
        </Button>
        {canManage && !external && (
          <Button
            type="submit"
            form="template-form"
            variant="solid"
            colorPalette="primary"
            isDisabled={formik.isSubmitting || hasFormErrors(errors)}
          >
            {intl.formatMessage(messages.save)}
          </Button>
        )}
      </ModalPage.Footer>
    </ModalPage.Root>
  );
};

export default TemplateForm;
