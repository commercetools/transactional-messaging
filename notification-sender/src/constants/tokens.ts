/** Password reset tokens are short-lived. Tokens of 60 minutes or less carry their value in the message. */
export const PASSWORD_RESET_TOKEN_TTL_MINUTES = 60;
/** Email verification tokens keep their original 30-day validity. */
export const EMAIL_VERIFICATION_TOKEN_TTL_MINUTES = 60 * 24 * 30;
