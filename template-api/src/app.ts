import express, {
  type Express,
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from 'express';
import CustomError from './errors/custom.error';
import { errorMiddleware } from './middleware/error.middleware';
import { authenticate } from './middleware/auth.middleware';
import { devCors, devSession } from './middleware/dev.middleware';
import { createTemplatesRouter } from './routes/templates.route';
import type { ServiceConfiguration } from './config';
import type { TemplateGateway } from './sendgrid/templates';

/** The mount path must match the `endpoint` in connect.yaml. */
export const ENDPOINT = '/templateApi';

export const createApp = (
  config: ServiceConfiguration,
  gateway: TemplateGateway,
  authMiddleware: RequestHandler = config.devMode
    ? devSession(config)
    : authenticate(config)
): Express => {
  const app: Express = express();
  app.disable('x-powered-by');
  if (config.devMode) app.use(devCors);
  app.use(express.json({ limit: '2mb' }));

  // Unauthenticated liveness probe for Connect. It returns nothing about the configuration.
  app.get(`${ENDPOINT}/health`, (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(ENDPOINT, authMiddleware, createTemplatesRouter(gateway, config));

  // Express 5 no longer accepts '*' as a path; a path-less middleware catches everything else.
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new CustomError(404, 'Path not found.'));
  });
  app.use(errorMiddleware);
  return app;
};
