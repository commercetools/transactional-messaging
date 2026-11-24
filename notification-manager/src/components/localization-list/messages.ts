import { defineMessages } from 'react-intl';

export default defineMessages({
  title: {
    id: 'LocalizationList.title',
    defaultMessage: 'Localizations',
    description: 'Title of the localization list',
  },
  subTitle: {
    id: 'LocalizationList.subTitle',
    defaultMessage:
      'Translate the texts used in emails and SMS messages. Choose a row to edit it.',
    description: 'Subtitle of the localization list',
  },
  addButton: {
    id: 'LocalizationList.addButton',
    defaultMessage: 'Add localization',
    description: 'Button to create a localization',
  },
  missingConfiguration: {
    id: 'LocalizationList.missingConfiguration',
    defaultMessage:
      'No localizations yet. Add one to translate the texts used in messages.',
    description: 'Shown when there are no localizations',
  },
  columnKey: {
    id: 'LocalizationList.columnKey',
    defaultMessage: 'Key',
    description: 'Column header for the key',
  },
  columnName: {
    id: 'LocalizationList.columnName',
    defaultMessage: 'Name',
    description: 'Column header for the name',
  },
});
