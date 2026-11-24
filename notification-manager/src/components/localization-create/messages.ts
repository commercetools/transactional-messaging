import { defineMessages } from 'react-intl';

export default defineMessages({
  title: {
    id: 'LocalizationCreate.title',
    defaultMessage: 'New localization',
    description: 'Title of the create localization page',
  },
  createSuccess: {
    id: 'LocalizationCreate.createSuccess',
    defaultMessage: 'Localization created.',
    description: 'Notification after a localization was created',
  },
  createError: {
    id: 'LocalizationCreate.createError',
    defaultMessage: 'Could not create the localization: {message}',
    description: 'Notification when creating a localization failed',
  },
});
