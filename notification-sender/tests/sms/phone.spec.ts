import { resolveRecipientPhone } from '../../src/sms/phone';
import type { Address, Customer, Order } from '@commercetools/platform-sdk';

const address = (id: string, fields: Partial<Address>): Address => ({ id, country: 'DE', ...fields }) as Address;
const customer = (addresses: Address[], defaultShippingAddressId?: string) =>
  ({ id: 'c-1', addresses, defaultShippingAddressId }) as unknown as Customer;
const order = (shipping?: Partial<Address>, billing?: Partial<Address>) =>
  ({
    id: 'o-1',
    shippingAddress: shipping ? address('s', { country: 'DE', ...shipping }) : undefined,
    billingAddress: billing ? address('b', { country: 'DE', ...billing }) : undefined,
  }) as unknown as Order;

describe('resolveRecipientPhone', () => {
  it('normalises a national number to E.164 using the address country', () => {
    expect(resolveRecipientPhone(undefined, order({ mobile: '0176 1234567' }))).toBe('+491761234567');
  });

  it('keeps an already E.164 number', () => {
    expect(resolveRecipientPhone(undefined, order({ mobile: '+491761234567' }))).toBe('+491761234567');
  });

  it('skips an invalid number and uses the next candidate', () => {
    expect(resolveRecipientPhone(undefined, order({ mobile: '12', phone: '0176 1234567' }))).toBe('+491761234567');
  });

  it('prefers the order shipping address over the customer address', () => {
    const c = customer([address('a1', { mobile: '+491700000001' })], 'a1');
    expect(resolveRecipientPhone(c, order({ mobile: '+491700000002' }))).toBe('+491700000002');
  });

  it('returns undefined without any candidate', () => {
    expect(resolveRecipientPhone(customer([]), order())).toBeUndefined();
    expect(resolveRecipientPhone(undefined, undefined)).toBeUndefined();
  });
});
