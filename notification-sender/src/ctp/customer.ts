import { createApiRoot } from '../client/create.client';
import { EMAIL_VERIFICATION_TOKEN_TTL_MINUTES } from '../constants/tokens';

export async function getCustomerById(customerId: string) {
  return await createApiRoot()
    .customers()
    .withId({ ID: customerId })
    .get()
    .execute()
    .then((response) => response.body);
}

export const createTokenForVerification = async (customerId: string) => {
  return await createApiRoot()
    .customers()
    .emailToken()
    .post({ body: { id: customerId, ttlMinutes: EMAIL_VERIFICATION_TOKEN_TTL_MINUTES } })
    .execute()
    .then((response) => response.body);
};

export const generatePasswordResetToken = async (email: string, ttlMinutes: number) => {
  return await createApiRoot()
    .customers()
    .passwordToken()
    .post({ body: { email, ttlMinutes } })
    .execute()
    .then((response) => response.body);
};
