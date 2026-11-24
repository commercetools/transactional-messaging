import { defineMessages } from 'react-intl';

export default defineMessages({
  title: {
    id: 'Templates.title',
    defaultMessage: 'Templates',
    description: 'Title of the templates list',
  },
  subTitle: {
    id: 'Templates.subTitle',
    defaultMessage:
      'Write the emails and SMS that notifications send. Templates live in SendGrid; map them to notifications under Mappings.',
    description: 'Subtitle of the templates list',
  },
  addButton: {
    id: 'Templates.addButton',
    defaultMessage: 'New template',
    description: 'Button to create a template',
  },
  emptyState: {
    id: 'Templates.emptyState',
    defaultMessage: 'No templates yet. Create one to get started.',
    description: 'Shown when SendGrid has no templates',
  },
  columnName: {
    id: 'Templates.columnName',
    defaultMessage: 'Name',
    description: 'Column header',
  },
  columnType: {
    id: 'Templates.columnType',
    defaultMessage: 'Type',
    description: 'Column header',
  },
  columnNotification: {
    id: 'Templates.columnNotification',
    defaultMessage: 'Notification',
    description: 'Column header',
  },
  columnModified: {
    id: 'Templates.columnModified',
    defaultMessage: 'Last modified',
    description: 'Column header',
  },
  columnActions: {
    id: 'Templates.columnActions',
    defaultMessage: 'Actions',
    description: 'Column header',
  },
  typeEmail: {
    id: 'Templates.typeEmail',
    defaultMessage: 'Email',
    description: 'Template type',
  },
  typeSms: {
    id: 'Templates.typeSms',
    defaultMessage: 'SMS',
    description: 'Template type',
  },
  createdInSendGrid: {
    id: 'Templates.createdInSendGrid',
    defaultMessage: 'Created in SendGrid',
    description:
      'Shown instead of a notification for templates not written here',
  },
  edit: {
    id: 'Templates.edit',
    defaultMessage: 'Edit',
    description: 'Edit button',
  },
  view: {
    id: 'Templates.view',
    defaultMessage: 'View',
    description: 'Button to open a read-only template',
  },
  delete: {
    id: 'Templates.delete',
    defaultMessage: 'Delete',
    description: 'Delete button',
  },
  cancel: {
    id: 'Templates.cancel',
    defaultMessage: 'Cancel',
    description: 'Cancel button',
  },
  save: {
    id: 'Templates.save',
    defaultMessage: 'Save',
    description: 'Save button',
  },
  deleteTitle: {
    id: 'Templates.deleteTitle',
    defaultMessage: 'Delete template',
    description: 'Delete dialog title',
  },
  deleteBody: {
    id: 'Templates.deleteBody',
    defaultMessage:
      '"{name}" will be removed from SendGrid. This cannot be undone.',
    description: 'Delete dialog text',
  },
  deleteBlocked: {
    id: 'Templates.deleteBlocked',
    defaultMessage:
      '"{name}" is used by a mapping. Change or remove that mapping first.',
    description: 'Shown when a mapped template cannot be deleted',
  },
  deleteSuccess: {
    id: 'Templates.deleteSuccess',
    defaultMessage: 'The template was deleted.',
    description: 'Notification',
  },
  deleteError: {
    id: 'Templates.deleteError',
    defaultMessage: 'The template could not be deleted. {message}',
    description: 'Notification',
  },
  saveSuccess: {
    id: 'Templates.saveSuccess',
    defaultMessage: 'The template was saved.',
    description: 'Notification',
  },
  saveError: {
    id: 'Templates.saveError',
    defaultMessage: 'The template could not be saved. {message}',
    description: 'Notification',
  },
  sourceSaveError: {
    id: 'Templates.sourceSaveError',
    defaultMessage:
      'The template was saved to SendGrid, but its editable source could not be stored. {message}',
    description: 'Notification',
  },
  loadError: {
    id: 'Templates.loadError',
    defaultMessage: 'The templates could not be loaded. {message}',
    description: 'Error message',
  },
  serviceMissing: {
    id: 'Templates.serviceMissing',
    defaultMessage:
      'The template service is not registered for this project. Deploy the template-api connector (see its README), then reload.',
    description: 'Shown when the service URL custom object is missing',
  },
  readOnlyNotice: {
    id: 'Templates.readOnlyNotice',
    defaultMessage: 'You can view templates but not change them.',
    description: 'Shown to users without the manage permission',
  },
  externalNotice: {
    id: 'Templates.externalNotice',
    defaultMessage:
      'This template was created in SendGrid, so its source is not available here. Edit it in SendGrid, or create a new template here.',
    description: 'Shown for templates without a stored source',
  },
  createTitle: {
    id: 'Templates.createTitle',
    defaultMessage: 'New template',
    description: 'Create page title',
  },
  editTitle: {
    id: 'Templates.editTitle',
    defaultMessage: 'Edit template',
    description: 'Edit page title',
  },
  nameLabel: {
    id: 'Templates.nameLabel',
    defaultMessage: 'Name',
    description: 'Field label',
  },
  typeLabel: {
    id: 'Templates.typeLabel',
    defaultMessage: 'Type',
    description: 'Field label',
  },
  notificationLabel: {
    id: 'Templates.notificationLabel',
    defaultMessage: 'Notification',
    description: 'Field label',
  },
  notificationHint: {
    id: 'Templates.notificationHint',
    defaultMessage:
      'Sets the variables, the sample data and the starting text. Changing it replaces the text only while you have not edited it.',
    description: 'Field hint',
  },
  subjectLabel: {
    id: 'Templates.subjectLabel',
    defaultMessage: 'Subject',
    description: 'Field label',
  },
  editorLabelEmail: {
    id: 'Templates.editorLabelEmail',
    defaultMessage: 'MJML',
    description: 'Editor heading for email templates',
  },
  editorLabelSms: {
    id: 'Templates.editorLabelSms',
    defaultMessage: 'Message text',
    description: 'Editor heading for SMS templates',
  },
  previewLabel: {
    id: 'Templates.previewLabel',
    defaultMessage: 'Preview',
    description: 'Preview heading',
  },
  previewSubject: {
    id: 'Templates.previewSubject',
    defaultMessage: 'Subject: {subject}',
    description: 'Rendered subject line above the preview',
  },
  previewLoading: {
    id: 'Templates.previewLoading',
    defaultMessage: 'Preparing the preview…',
    description: 'Shown while the MJML compiler loads',
  },
  previewNeedsNotification: {
    id: 'Templates.previewNeedsNotification',
    defaultMessage: 'Select a notification to see a preview with sample data.',
    description: 'Shown until a notification is selected',
  },
  variablePlaceholder: {
    id: 'Templates.variablePlaceholder',
    defaultMessage: 'Insert a variable…',
    description: 'Placeholder of the variable picker',
  },
  variableLabel: {
    id: 'Templates.variableLabel',
    defaultMessage: 'Insert a variable at the cursor',
    description: 'Accessible label of the variable picker',
  },
  payloadTitle: {
    id: 'Templates.payloadTitle',
    defaultMessage: 'Sample message',
    description: 'Heading of the sample payload',
  },
  payloadHint: {
    id: 'Templates.payloadHint',
    defaultMessage:
      'The commercetools message the connector receives for this notification. The preview uses the order, customer and tokens fetched with it.',
    description: 'Explains the sample payload',
  },
  smsCount: {
    id: 'Templates.smsCount',
    defaultMessage:
      '{count}/{max} characters · {segments, plural, one {# segment} other {# segments}} · {encoding}',
    description: 'SMS length status',
  },
  errorRequired: {
    id: 'Templates.errorRequired',
    defaultMessage: 'This field is required.',
    description: 'Validation message',
  },
  errorName: {
    id: 'Templates.errorName',
    defaultMessage: 'Use at most {max} characters.',
    description: 'Validation message',
  },
  errorTemplate: {
    id: 'Templates.errorTemplate',
    defaultMessage: 'The template cannot be rendered: {detail}',
    description: 'Validation message for a broken template',
  },
  errorSmsTooLong: {
    id: 'Templates.errorSmsTooLong',
    defaultMessage: 'The text is longer than {max} characters.',
    description: 'Validation message',
  },
});
