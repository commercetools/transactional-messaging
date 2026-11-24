import { SAMPLES, buildSampleData } from '../../src/notifications/samples';
import { handleOrderCreatedMessage } from '../../src/handlers/order-confirmation.handler';
import { handleOrderStateChanged } from '../../src/handlers/order-state-change.handler';
import { handleShipmentStateChanged } from '../../src/handlers/shipment-state-change.handler';
import { handleReturnInfo } from '../../src/handlers/order-refund.handler';
import { handleCustomerCreated } from '../../src/handlers/customer-registration.handler';
import { handleCustomerPasswordTokenCreated } from '../../src/handlers/customer-password-token-creation.handler';
import { getOrderById } from '../../src/ctp/order';
import {
  createTokenForVerification,
  getCustomerById,
} from '../../src/ctp/customer';

jest.mock('../../src/ctp/order', () => ({ getOrderById: jest.fn() }));
jest.mock('../../src/ctp/customer', () => ({
  getCustomerById: jest.fn(),
  createTokenForVerification: jest.fn(),
  generatePasswordResetToken: jest.fn(),
}));

/**
 * The Merchant Center previews with buildSampleData. These tests keep that honest: feeding the sample
 * message through the real handler, with the sample resources behind the API calls, gives the same data.
 */
describe('handlers produce what the Merchant Center previews', () => {
  beforeEach(() => {
    process.env.DEFAULT_LOCALE = 'en-US';
    const { resources } = SAMPLES['order-confirmation'];
    (getOrderById as jest.Mock).mockResolvedValue(resources.order);
    (getCustomerById as jest.Mock).mockResolvedValue(resources.customer);
    (createTokenForVerification as jest.Mock).mockResolvedValue(
      SAMPLES['customer-registration'].resources.emailToken
    );
  });

  const run = (
    handler: (message: never, languages: string[]) => Promise<unknown>,
    key: keyof typeof SAMPLES
  ) => handler(SAMPLES[key].message as never, SAMPLES[key].languages);

  const expectSame = (result: unknown, key: keyof typeof SAMPLES): void => {
    const { locale, templateData } = buildSampleData(key);
    expect(result).toMatchObject({ notification: key, locale, templateData });
  };

  it('order-confirmation', async () =>
    expectSame(
      await run(handleOrderCreatedMessage, 'order-confirmation'),
      'order-confirmation'
    ));

  it('order-state-change', async () =>
    expectSame(
      await run(handleOrderStateChanged, 'order-state-change'),
      'order-state-change'
    ));

  it('shipment-state-change', async () =>
    expectSame(
      await run(handleShipmentStateChanged, 'shipment-state-change'),
      'shipment-state-change'
    ));

  it('order-refund', async () =>
    expectSame(await run(handleReturnInfo, 'order-refund'), 'order-refund'));

  it('customer-registration', async () =>
    expectSame(
      await run(handleCustomerCreated, 'customer-registration'),
      'customer-registration'
    ));

  it('customer-password-reset', async () =>
    expectSame(
      await run(handleCustomerPasswordTokenCreated, 'customer-password-reset'),
      'customer-password-reset'
    ));
});
