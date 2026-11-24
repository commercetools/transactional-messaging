import CustomError from '../errors/custom.error';

type SendGridError = {
  code?: unknown;
  response?: { body?: { errors?: Array<{ message?: unknown }> } };
};

/**
 * Maps a SendGrid SDK error to an HTTP error for the Merchant Center.
 * The message comes from SendGrid's own validation text; it never contains the API key.
 */
export const toHttpError = (error: unknown): CustomError => {
  if (error instanceof CustomError) return error;
  const sendGrid = error as SendGridError;
  const status = typeof sendGrid?.code === 'number' ? sendGrid.code : undefined;
  const detail = sendGrid?.response?.body?.errors?.[0]?.message;
  const detailText = typeof detail === 'string' ? ` ${detail}` : '';

  if (status === 404) return new CustomError(404, 'Template not found.');
  if (status === 400 || status === 422) {
    return new CustomError(400, `SendGrid rejected the template.${detailText}`);
  }
  if (status === 401 || status === 403) {
    return new CustomError(
      502,
      'SendGrid rejected the API key. It needs the Template Engine permissions.'
    );
  }
  if (status === 429) {
    return new CustomError(
      503,
      'SendGrid is rate limiting requests. Try again shortly.'
    );
  }
  return new CustomError(502, 'SendGrid request failed.');
};
