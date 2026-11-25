import { defineMessages } from 'react-intl';

export default defineMessages({
  keyTitle: {
    id: 'LocalizationForm.keyTitle',
    defaultMessage: 'Set key',
    description: 'Label for the localization key',
  },
  keyHint: {
    id: 'LocalizationForm.keyHint',
    defaultMessage:
      'Notifications read only the set with the key transactional-emails. Two to 256 letters, numbers, hyphens or underscores; it cannot be changed later.',
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
    defaultMessage: 'Set name',
    description: 'Label for the localized name',
  },
  nameRequired: {
    id: 'LocalizationForm.nameRequired',
    defaultMessage: 'A name is required in at least one language.',
    description: 'Validation error when no name is entered',
  },
  entriesTitle: {
    id: 'LocalizationForm.entriesTitle',
    defaultMessage: 'Texts per message type',
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
    defaultMessage: 'Group name',
    description: 'Label for the name of a message type entry',
  },
  valueKeyTitle: {
    id: 'LocalizationForm.valueKeyTitle',
    defaultMessage: 'Variable name',
    description: 'Label for the key of a translatable value',
  },
  valueLabelTitle: {
    id: 'LocalizationForm.valueLabelTitle',
    defaultMessage: 'Translated text',
    description: 'Label for the localized text of a translatable value',
  },
  addEntry: {
    id: 'LocalizationForm.addEntry',
    defaultMessage: 'Add message type',
    description: 'Button to add a message type entry',
  },
  addValue: {
    id: 'LocalizationForm.addValue',
    defaultMessage: 'Add text',
    description: 'Button to add a value to a message type entry',
  },
  deleteEntry: {
    id: 'LocalizationForm.deleteEntry',
    defaultMessage: 'Delete message type',
    description: 'Accessible label for deleting a message type entry',
  },
  deleteValue: {
    id: 'LocalizationForm.deleteValue',
    defaultMessage: 'Delete text',
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
      'You can view these translations, but you need the Manage permission to change them.',
    description: 'Shown to users without manage permission',
  },
  nameHint: {
    id: 'LocalizationForm.nameHint',
    defaultMessage: 'Shown in the Localizations list only.',
    description: 'Hint for the name of a translation set',
  },
  entriesHint: {
    id: 'LocalizationForm.entriesHint',
    defaultMessage:
      'Each notification is triggered by a commercetools message type and uses the texts of that type. Every text becomes a variable in the templates of that notification.',
    description: 'Explains the message type groups',
  },
  entryKeyUnused: {
    id: 'LocalizationForm.entryKeyUnused',
    defaultMessage:
      'No notification uses this message type, so its texts are never sent.',
    description: 'Hint under a message type that no notification uses',
  },
  entryNameHint: {
    id: 'LocalizationForm.entryNameHint',
    defaultMessage: 'For your reference only.',
    description: 'Hint for the name of a message type group',
  },
  valueKeyHint: {
    id: 'LocalizationForm.valueKeyHint',
    defaultMessage: 'Templates use it as {token}.',
    description: 'Hint for the variable name of a text',
  },
});
