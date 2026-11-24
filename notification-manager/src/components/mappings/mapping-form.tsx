import { type FC, useState } from 'react';
import { useFormik } from 'formik';
import { useIntl } from 'react-intl';
import {
  Alert,
  Button,
  ConfirmationDialog,
  FormField,
  ModalPage,
  RadioInput,
  Select,
  Stack,
  Switch,
  Text,
} from '@commercetools/nimbus';
import {
  NOTIFICATION_KEYS,
  type Channel,
  type NotificationKey,
} from '../../shared/notifications/keys';
import messages from './messages';
import TemplatePicker from './template-picker';
import {
  ERROR_MESSAGES,
  NOTIFICATION_LABELS,
  type ErrorCode,
  type MappingFormValues,
  hasFormErrors,
  validateMappingForm,
} from './mapping-helpers';

type Props = {
  mode: 'create' | 'edit';
  title: string;
  initialValues: MappingFormValues;
  existingKeys: string[];
  canManage: boolean;
  onSubmit: (values: MappingFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
};

const MappingForm: FC<Props> = ({
  mode,
  title,
  initialValues,
  existingKeys,
  canManage,
  onSubmit,
  onDelete,
  onClose,
}) => {
  const intl = useIntl();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formik = useFormik<MappingFormValues>({
    initialValues,
    validate: (values) => {
      const errors = validateMappingForm(
        values,
        mode === 'create' ? existingKeys : []
      );
      return hasFormErrors(errors) ? errors : {};
    },
    onSubmit: async (values) => {
      await onSubmit(values);
    },
  });

  const readOnly = !canManage;
  const isEdit = mode === 'edit';
  const { notification, channel, enabled } = formik.values;
  const errors = validateMappingForm(
    formik.values,
    mode === 'create' ? existingKeys : []
  );
  const errorText = (code?: ErrorCode) =>
    code ? intl.formatMessage(ERROR_MESSAGES[code]) : undefined;

  return (
    <ModalPage.Root isOpen onClose={onClose} width="xl">
      <ModalPage.TopBar
        previousPathLabel={intl.formatMessage(messages.cancel)}
        currentPathLabel={title}
      />
      <ModalPage.Header>
        <ModalPage.Title>{title}</ModalPage.Title>
      </ModalPage.Header>
      <ModalPage.Content>
        <form id="mapping-form" onSubmit={formik.handleSubmit} noValidate>
          <Stack direction="column" gap="600">
            {readOnly && (
              <Alert.Root colorPalette="info">
                <Alert.Description>
                  {intl.formatMessage(messages.readOnlyNotice)}
                </Alert.Description>
              </Alert.Root>
            )}

            <FormField.Root isRequired isDisabled={isEdit || readOnly}>
              <FormField.Label>
                {intl.formatMessage(messages.notificationLabel)}
              </FormField.Label>
              <FormField.Input>
                <Select.Root
                  aria-label={intl.formatMessage(messages.notificationLabel)}
                  placeholder="—"
                  selectedKey={notification || null}
                  isDisabled={isEdit || readOnly}
                  onSelectionChange={(key) =>
                    void formik.setFieldValue('notification', String(key))
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
              {formik.touched.notification && errors.notification && (
                <FormField.Error>
                  {errorText(errors.notification)}
                </FormField.Error>
              )}
            </FormField.Root>

            <FormField.Root isDisabled={isEdit || readOnly}>
              <FormField.Label>
                {intl.formatMessage(messages.typeLabel)}
              </FormField.Label>
              <FormField.Input>
                <RadioInput.Root
                  name="mapping-channel"
                  orientation="horizontal"
                  aria-label={intl.formatMessage(messages.typeLabel)}
                  value={channel}
                  isDisabled={isEdit || readOnly}
                  onChange={(value: string) => {
                    // A template of one type is not valid for the other.
                    void formik.setFieldValue('channel', value as Channel);
                    void formik.setFieldValue('templateId', '');
                    void formik.setFieldTouched('templateId', false);
                  }}
                >
                  <RadioInput.Option value="email">
                    {intl.formatMessage(messages.typeEmail)}
                  </RadioInput.Option>
                  <RadioInput.Option value="sms">
                    {intl.formatMessage(messages.typeSms)}
                  </RadioInput.Option>
                </RadioInput.Root>
              </FormField.Input>
            </FormField.Root>

            <FormField.Root>
              <FormField.Label>
                {intl.formatMessage(messages.enabledLabel)}
              </FormField.Label>
              <FormField.Input>
                <Switch
                  isSelected={enabled}
                  isDisabled={readOnly}
                  onChange={(value: boolean) =>
                    void formik.setFieldValue('enabled', value)
                  }
                >
                  {intl.formatMessage(messages.enabledLabel)}
                </Switch>
              </FormField.Input>
              <FormField.Description>
                {intl.formatMessage(messages.enabledHint)}
              </FormField.Description>
            </FormField.Root>

            <TemplatePicker
              key={channel}
              channel={channel}
              value={formik.values.templateId}
              onChange={(templateId) =>
                void formik.setFieldValue('templateId', templateId)
              }
              onBlur={() => void formik.setFieldTouched('templateId', true)}
              isDisabled={readOnly}
              error={
                formik.touched.templateId
                  ? errorText(errors.templateId)
                  : undefined
              }
            />
          </Stack>
        </form>
      </ModalPage.Content>
      <ModalPage.Footer>
        <Button slot="close" variant="outline">
          {intl.formatMessage(messages.cancel)}
        </Button>
        {isEdit && onDelete && canManage && (
          <Button
            variant="outline"
            colorPalette="critical"
            onPress={() => setConfirmDelete(true)}
          >
            {intl.formatMessage(messages.delete)}
          </Button>
        )}
        {canManage && (
          <Button
            type="submit"
            form="mapping-form"
            variant="solid"
            colorPalette="primary"
            isDisabled={formik.isSubmitting || hasFormErrors(errors)}
          >
            {intl.formatMessage(messages.save)}
          </Button>
        )}
      </ModalPage.Footer>
      {onDelete && (
        <ConfirmationDialog
          title={intl.formatMessage(messages.deleteTitle)}
          intent="destructive"
          confirmLabel={intl.formatMessage(messages.delete)}
          cancelLabel={intl.formatMessage(messages.cancel)}
          isOpen={confirmDelete}
          onOpenChange={setConfirmDelete}
          onConfirm={() => onDelete()}
          onCancel={() => setConfirmDelete(false)}
        >
          <Text>{intl.formatMessage(messages.deleteBody)}</Text>
        </ConfirmationDialog>
      )}
    </ModalPage.Root>
  );
};

export default MappingForm;
