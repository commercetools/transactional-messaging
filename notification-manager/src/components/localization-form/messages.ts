import { defineMessages } from 'react-intl';

export default defineMessages({
  keyTitle: {
    id: 'LocalizationForm.keyTitle',
    defaultMessage: 'Key',
    description: 'Label for the localization key',
  },
  keyHint: {
    id: 'LocalizationForm.keyHint',
    defaultMessage: 'Two to 256 letters, numbers, hyphens or underscores.',
    description: 'Hint for the localization key',
  },
  keyInvalid: {
    id: 'LocalizationForm.keyInvalid',
    defaultMessage: 'Use two to 256 letters, numbers, hyphens or underscores.',
    description: 'Validation error for the localization key',
  },
  keyRequired: {
    id: 'LocalizationForm.keyRequired',
    defaultMessage: 'A key is required.',
    description: 'Validation error when the localization key is missing',
  },
  nameTitle: {
    id: 'LocalizationForm.nameTitle',
    defaultMessage: 'Name',
    description: 'Label for the localized name',
  },
  nameRequired: {
    id: 'LocalizationForm.nameRequired',
    defaultMessage: 'A name is required in at least one language.',
    description: 'Validation error when no name is entered',
  },
  entriesTitle: {
    id: 'LocalizationForm.entriesTitle',
    defaultMessage: 'Message types',
    description: 'Section title for the entries of a localization',
  },
  entryKeyTitle: {
    id: 'LocalizationForm.entryKeyTitle',
    defaultMessage: 'Message type',
    description:
      'Label for the message type of an entry, for example OrderCreated',
  },
  entryNameTitle: {
    id: 'LocalizationForm.entryNameTitle',
    defaultMessage: 'Name',
    description: 'Label for the name of a message type entry',
  },
  valueKeyTitle: {
    id: 'LocalizationForm.valueKeyTitle',
    defaultMessage: 'Value key',
    description: 'Label for the key of a translatable value',
  },
  valueLabelTitle: {
    id: 'LocalizationForm.valueLabelTitle',
    defaultMessage: 'Text',
    description: 'Label for the localized text of a translatable value',
  },
  addEntry: {
    id: 'LocalizationForm.addEntry',
    defaultMessage: 'Add message type',
    description: 'Button to add a message type entry',
  },
  addValue: {
    id: 'LocalizationForm.addValue',
    defaultMessage: 'Add value',
    description: 'Button to add a value to a message type entry',
  },
  deleteEntry: {
    id: 'LocalizationForm.deleteEntry',
    defaultMessage: 'Delete message type',
    description: 'Accessible label for deleting a message type entry',
  },
  deleteValue: {
    id: 'LocalizationForm.deleteValue',
    defaultMessage: 'Delete value',
    description: 'Accessible label for deleting a value',
  },
  save: {
    id: 'LocalizationForm.save',
    defaultMessage: 'Save',
    description: 'Save button',
  },
  cancel: {
    id: 'LocalizationForm.cancel',
    defaultMessage: 'Cancel',
    description: 'Cancel button',
  },
  delete: {
    id: 'LocalizationForm.delete',
    defaultMessage: 'Delete',
    description: 'Delete button',
  },
  readOnlyNotice: {
    id: 'LocalizationForm.readOnlyNotice',
    defaultMessage:
      'You can view this localization, but you need manage permission to change it.',
    description: 'Shown to users without manage permission',
  },
});
