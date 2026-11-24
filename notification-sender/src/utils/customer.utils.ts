import type { Customer, Order } from '@commercetools/platform-sdk';
import { findLocale as findLocaleWith } from '../notifications/template-data';
import { readDefaultLocale } from './config.utils';

export const findLocale = (customer?: Customer, order?: Order) =>
  findLocaleWith(customer, order, readDefaultLocale());

/** Narrows a template value to a usable email recipient; empty values become undefined. */
export const recipientOf = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;
