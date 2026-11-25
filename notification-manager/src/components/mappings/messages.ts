import { defineMessages } from 'react-intl';

export default defineMessages({
  title: {
    id: 'Mappings.title',
    defaultMessage: 'Mappings',
    description: 'Title of the mappings list',
  },
  subTitle: {
    id: 'Mappings.subTitle',
    defaultMessage:
      'Map each notification to the SendGrid template it sends, for email and for SMS.',
    description: 'Subtitle of the mappings list',
  },
  addButton: {
    id: 'Mappings.addButton',
    defaultMessage: 'Add mapping',
    description: 'Button to create a mapping',
  },
  emptyState: {
    id: 'Mappings.emptyState',
    defaultMessage:
      'No mappings yet, so no notification is sent. Create templates under Templates, then add a mapping for each notification and channel you want to send.',
    description: 'Shown when no mapping exists',
  },
  columnNotification: {
    id: 'Mappings.columnNotification',
    defaultMessage: 'Notification',
    description: 'Column header',
  },
  columnType: {
    id: 'Mappings.columnType',
    defaultMessage: 'Type',
    description: 'Column header',
  },
  columnStatus: {
    id: 'Mappings.columnStatus',
    defaultMessage: 'Status',
    description: 'Column header',
  },
  columnDetails: {
    id: 'Mappings.columnDetails',
    defaultMessage: 'Details',
    description: 'Column header',
  },
  columnModified: {
    id: 'Mappings.columnModified',
    defaultMessage: 'Last modified',
    description: 'Column header',
  },
  coverageTitle: {
    id: 'Mappings.coverageTitle',
    defaultMessage: 'Coverage',
    description: 'Heading of the coverage grid',
  },
  coverageEmail: {
    id: 'Mappings.coverageEmail',
    defaultMessage: 'Email',
    description: 'Coverage column',
  },
  coverageSms: {
    id: 'Mappings.coverageSms',
    defaultMessage: 'SMS',
    description: 'Coverage column',
  },
  statusEnabled: {
    id: 'Mappings.statusEnabled',
    defaultMessage: 'Enabled',
    description: 'Mapping status',
  },
  statusDisabled: {
    id: 'Mappings.statusDisabled',
    defaultMessage: 'Disabled',
    description: 'Mapping status',
  },
  statusInvalid: {
    id: 'Mappings.statusInvalid',
    defaultMessage: 'Invalid',
    description: 'Mapping status',
  },
  typeEmail: {
    id: 'Mappings.typeEmail',
    defaultMessage: 'Email',
    description: 'Mapping type',
  },
  typeSms: {
    id: 'Mappings.typeSms',
    defaultMessage: 'SMS',
    description: 'Mapping type',
  },
  readOnlyNotice: {
    id: 'Mappings.readOnlyNotice',
    defaultMessage:
      'You can view this mapping but not change it. Ask an administrator for the Manage permission.',
    description: 'Shown without manage permission',
  },
  notificationLabel: {
    id: 'Mappings.notificationLabel',
    defaultMessage: 'Notification',
    description: 'Form label',
  },
  typeLabel: {
    id: 'Mappings.typeLabel',
    defaultMessage: 'Type',
    description: 'Form label',
  },
  enabledLabel: {
    id: 'Mappings.enabledLabel',
    defaultMessage: 'Enabled',
    description: 'Form label',
  },
  enabledHint: {
    id: 'Mappings.enabledHint',
    defaultMessage:
      'Disabled mappings are never sent. New mappings start disabled.',
    description: 'Hint under the enabled switch',
  },
  sendGridIdLabel: {
    id: 'Mappings.sendGridIdLabel',
    defaultMessage: 'SendGrid dynamic template ID',
    description: 'Form label for the SendGrid template ID',
  },
  templateLabel: {
    id: 'Mappings.templateLabel',
    defaultMessage: 'SendGrid template',
    description: 'Form label for the template dropdown',
  },
  templateHint: {
    id: 'Mappings.templateHint',
    defaultMessage:
      'Only templates of the selected type are listed. Create or edit them under Templates.',
    description: 'Hint under the template dropdown',
  },
  templatesEmpty: {
    id: 'Mappings.templatesEmpty',
    defaultMessage:
      'There are no {channel, select, sms {SMS} other {email}} templates in SendGrid yet. Create one under Templates first.',
    description: 'Shown when the dropdown has no templates',
  },
  templateNotFound: {
    id: 'Mappings.templateNotFound',
    defaultMessage: '{id} (not found in SendGrid)',
    description: 'Option for a mapped template that no longer exists',
  },
  templateServiceUnavailable: {
    id: 'Mappings.templateServiceUnavailable',
    defaultMessage:
      'The template service is not reachable, so the SendGrid templates cannot be listed. Enter the template ID instead.',
    description: 'Shown when the template service cannot be used',
  },
  sendGridIdHint: {
    id: 'Mappings.sendGridIdHint',
    defaultMessage:
      'The ID of a dynamic template in your SendGrid account, for example d-0123…',
    description: 'Hint for the SendGrid template ID',
  },
  save: {
    id: 'Mappings.save',
    defaultMessage: 'Save',
    description: 'Save button',
  },
  cancel: {
    id: 'Mappings.cancel',
    defaultMessage: 'Cancel',
    description: 'Cancel button',
  },
  delete: {
    id: 'Mappings.delete',
    defaultMessage: 'Delete',
    description: 'Delete button',
  },
  deleteTitle: {
    id: 'Mappings.deleteTitle',
    defaultMessage: 'Delete this mapping?',
    description: 'Delete dialog title',
  },
  deleteBody: {
    id: 'Mappings.deleteBody',
    defaultMessage:
      'Messages for this notification and type stop. Emails fall back to the template ID configured on the connector, if one is set.',
    description: 'Delete dialog body',
  },
  createTitle: {
    id: 'Mappings.createTitle',
    defaultMessage: 'Add mapping',
    description: 'Create form title',
  },
  editTitle: {
    id: 'Mappings.editTitle',
    defaultMessage: 'Edit mapping',
    description: 'Edit form title',
  },
  invalidMapping: {
    id: 'Mappings.invalidMapping',
    defaultMessage:
      'This mapping is invalid and the connector ignores it. Delete it and create it again.',
    description: 'Shown for an invalid mapping',
  },
  conflict: {
    id: 'Mappings.conflict',
    defaultMessage:
      'This mapping was changed by someone else. Reload to see the latest version.',
    description: 'Shown on a version conflict',
  },
  saveSuccess: {
    id: 'Mappings.saveSuccess',
    defaultMessage: 'Mapping saved.',
    description: 'Success notification',
  },
  deleteSuccess: {
    id: 'Mappings.deleteSuccess',
    defaultMessage: 'Mapping deleted.',
    description: 'Success notification',
  },
  saveError: {
    id: 'Mappings.saveError',
    defaultMessage: 'The mapping could not be saved: {message}',
    description: 'Error notification',
  },
  error_required: {
    id: 'Mappings.error.required',
    defaultMessage: 'This field is required.',
    description: 'Validation',
  },
  error_invalidSendGridId: {
    id: 'Mappings.error.invalidSendGridId',
    defaultMessage:
      'Enter a SendGrid template ID in the form d- followed by 32 lowercase hex characters.',
    description: 'Validation',
  },
  error_duplicate: {
    id: 'Mappings.error.duplicate',
    defaultMessage:
      'A mapping for this notification and type already exists. Edit that one instead.',
    description: 'Validation',
  },
  notification_customer_registration: {
    id: 'Mappings.notification.customerRegistration',
    defaultMessage: 'Customer registration',
    description: 'Notification label',
  },
  notification_customer_password_reset: {
    id: 'Mappings.notification.passwordReset',
    defaultMessage: 'Password reset',
    description: 'Notification label',
  },
  notification_order_confirmation: {
    id: 'Mappings.notification.orderConfirmation',
    defaultMessage: 'Order confirmation',
    description: 'Notification label',
  },
  notification_order_state_change: {
    id: 'Mappings.notification.orderStatus',
    defaultMessage: 'Order status update',
    description: 'Notification label',
  },
  notification_shipment_state_change: {
    id: 'Mappings.notification.shipping',
    defaultMessage: 'Shipping update',
    description: 'Notification label',
  },
  notification_order_refund: {
    id: 'Mappings.notification.refund',
    defaultMessage: 'Return / refund',
    description: 'Notification label',
  },
});
