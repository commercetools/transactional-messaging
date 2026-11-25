import type { NextFunction, Request, RequestHandler, Response } from 'express';
import CustomError from '../errors/custom.error';
import { permissionNames, type ServiceConfiguration } from '../config';

// In local development the browser runs the Merchant Center (https://mc.<region>.commercetools.com) or the
// dev server itself, and calls this service directly. Nothing else may call it from a browser.
const MC_ORIGIN =
  /^https:\/\/mc\.[a-z0-9-]+(\.[a-z0-9-]+)*\.commercetools\.(com|co)$/;
const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\]):\d+$/;

export const isAllowedDevOrigin = (origin: string): boolean =>
  MC_ORIGIN.test(origin) || LOCAL_ORIGIN.test(origin);

/** CORS for dev mode. A browser request from any other website is refused, so a page you visit cannot reach this service. */
export const devCors: RequestHandler = (req, res, next) => {
  const origin = req.headers.origin;
  if (origin !== undefined) {
    if (!isAllowedDevOrigin(origin)) {
      next(new CustomError(403, 'Origin not allowed.'));
      return;
    }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET,POST,PUT,DELETE,OPTIONS'
    );
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // Chrome asks before a public site may reach a local server.
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
};

/** Stands in for the token check: the caller is a local developer with View and Manage. */
export const devSession =
  (config: ServiceConfiguration): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    const names = permissionNames(config.entryPointUriPath);
    req.session = {
      userId: 'local-dev',
      projectKey: 'local-dev',
      userPermissions: [names.view, names.manage],
    };
    next();
  };
