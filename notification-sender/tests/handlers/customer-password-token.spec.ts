import { handleCustomerPasswordTokenCreated } from '../../src/handlers/customer-password-token-creation.handler';
import { generatePasswordResetToken, getCustomerById } from '../../src/ctp/customer';

jest.mock('../../src/ctp/customer', () => ({
  getCustomerById: jest.fn(),
  generatePasswordResetToken: jest.fn(),
}));

const customer = {
  id: 'c-1',
  email: 'jane@example.com',
  firstName: 'Jane',
  lastName: 'Doe',
  createdAt: '2026-01-01T00:00:00.000Z',
  isEmailVerified: true,
  locale: 'en-US',
};

const message = (extra: Record<string, unknown> = {}) =>
  ({
    type: 'CustomerPasswordTokenCreated',
    customerId: 'c-1',
    expiresAt: '2026-01-01T01:00:00.000Z',
    resource: { typeId: 'customer-password-token', id: 't-1' },
    ...extra,
  }) as never;

describe('handleCustomerPasswordTokenCreated', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CUSTOMER_PASSWORD_TOKEN_CREATION_TEMPLATE_ID = 'd-reset';
    process.env.DEFAULT_LOCALE = 'en-US';
    (getCustomerById as jest.Mock).mockResolvedValue(customer);
  });

  it('uses the token carried by the message and does not mint a new one (loop guard)', async () => {
    const result = await handleCustomerPasswordTokenCreated(
      message({ value: 'token-from-message' }),
      ['en-US']
    );
    expect(generatePasswordResetToken).not.toHaveBeenCalled();
    expect(result?.templateData.customerPasswordToken).toBe('token-from-message');
  });

  it('mints a 60-minute token only when the message carries no value', async () => {
    (generatePasswordResetToken as jest.Mock).mockResolvedValue({
      value: 'minted',
      expiresAt: '2026-01-01T01:00:00.000Z',
    });
    const result = await handleCustomerPasswordTokenCreated(message(), ['en-US']);
    expect(generatePasswordResetToken).toHaveBeenCalledWith('jane@example.com', 60);
    expect(result?.templateData.customerPasswordToken).toBe('minted');
  });
});
