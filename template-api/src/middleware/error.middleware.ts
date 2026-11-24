import type { ErrorRequestHandler } from 'express';
import CustomError from '../errors/custom.error';

/** Never returns stack traces, validation internals or secrets. */
export const errorMiddleware: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next
) => {
  if (error instanceof CustomError) {
    res.status(Number(error.statusCode)).json({ message: error.message });
    return;
  }
  // Body-parser errors (for example malformed JSON) carry a 4xx status.
  const status = (error as { status?: unknown }).status;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    res.status(status).json({ message: 'Bad request.' });
    return;
  }
  res.status(500).json({ message: 'Internal server error.' });
};
