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
      'Translated texts that templates use as {token}. Notifications read only the set with the key transactional-emails.',
    description: 'Subtitle of the localization list',
  },
  addButton: {
    id: 'LocalizationList.addButton',
    defaultMessage: 'New translation set',
    description: 'Button to create a localization',
  },
  missingConfiguration: {
    id: 'LocalizationList.missingConfiguration',
    defaultMessage:
      'No translations yet. Create a set with the key transactional-emails; until then, notifications use the built-in texts.',
    description: 'Shown when there are no localizations',
  },
  columnKey: {
    id: 'LocalizationList.columnKey',
    defaultMessage: 'Set key',
    description: 'Column header for the key',
  },
  columnName: {
    id: 'LocalizationList.columnName',
    defaultMessage: 'Set name',
    description: 'Column header for the name',
  },
  columnUsed: {
    id: 'LocalizationList.columnUsed',
    defaultMessage: 'Used by notifications',
    description: 'Column header: whether the connector reads this set',
  },
  used: {
    id: 'LocalizationList.used',
    defaultMessage: 'Yes',
    description: 'The connector reads this set',
  },
  unused: {
    id: 'LocalizationList.unused',
    defaultMessage: 'No',
    description: 'The connector ignores this set',
  },
});
