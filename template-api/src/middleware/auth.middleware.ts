import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { createSessionMiddleware } from '@commercetools-backend/express';
import CustomError from '../errors/custom.error';
import { permissionNames, type ServiceConfiguration } from '../config';

/** What the Merchant Center token carries (see createSessionMiddleware). */
export type Session = {
  userId: string;
  projectKey: string;
  userPermissions?: string[];
};

declare module 'express-serve-static-core' {
  interface Request {
    session?: Session;
  }
}

/**
 * Verifies the Merchant Center token on every request (issuer, audience, signature, expiry).
 * Failures return 401 with a generic message; the reason stays in the server logs only.
 */
export const authenticate = (config: ServiceConfiguration): RequestHandler => {
  // The package bundles its own @types/express, so its handler type is narrowed to ours here.
  const verify = createSessionMiddleware({
    audience: config.audience,
    issuer: config.cloudIdentifier,
  }) as unknown as (
    req: Request,
    res: Response,
    next: (error?: unknown) => void
  ) => Promise<void>;
  return (req: Request, res: Response, next: NextFunction) => {
    void verify(req, res, (error?: unknown) => {
      if (error) {
        next(new CustomError(401, 'Unauthorized.'));
        return;
      }
      next();
    });
  };
};

const hasPermission = (session: Session | undefined, names: string[]) => {
  const granted = new Set(
    (session?.userPermissions ?? []).map((name) => name.toLowerCase())
  );
  return names.some((name) => granted.has(name.toLowerCase()));
};

/** Reads need View or Manage. Writes need Manage. */
export const requirePermission = (
  config: ServiceConfiguration,
  level: 'view' | 'manage'
): RequestHandler => {
  const names = permissionNames(config.entryPointUriPath);
  const accepted =
    level === 'manage' ? [names.manage] : [names.view, names.manage];
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!hasPermission(req.session, accepted)) {
      next(new CustomError(403, 'You do not have permission for this action.'));
      return;
    }
    next();
  };
};
