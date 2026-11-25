import { defineMessages } from 'react-intl';

export default defineMessages({
  title: {
    id: 'LocalizationEdit.title',
    defaultMessage: 'Edit translation set',
    description: 'Title of the edit localization page',
  },
  editSuccess: {
    id: 'LocalizationEdit.editSuccess',
    defaultMessage: 'Translation set saved.',
    description: 'Notification after a localization was saved',
  },
  editError: {
    id: 'LocalizationEdit.editError',
    defaultMessage: 'Could not save the translation set: {message}',
    description: 'Notification when saving a localization failed',
  },
  deleteSuccess: {
    id: 'LocalizationEdit.deleteSuccess',
    defaultMessage: 'Translation set deleted.',
    description: 'Notification after a localization was deleted',
  },
});
