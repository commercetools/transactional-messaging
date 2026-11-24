import { defineMessages } from 'react-intl';

export default defineMessages({
  title: {
    id: 'LocalizationEdit.title',
    defaultMessage: 'Edit localization',
    description: 'Title of the edit localization page',
  },
  editSuccess: {
    id: 'LocalizationEdit.editSuccess',
    defaultMessage: 'Localization saved.',
    description: 'Notification after a localization was saved',
  },
  editError: {
    id: 'LocalizationEdit.editError',
    defaultMessage: 'Could not save the localization: {message}',
    description: 'Notification when saving a localization failed',
  },
  deleteSuccess: {
    id: 'LocalizationEdit.deleteSuccess',
    defaultMessage: 'Localization deleted.',
    description: 'Notification after a localization was deleted',
  },
});
