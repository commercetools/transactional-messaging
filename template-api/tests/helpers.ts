import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { createApp } from '../src/app';
import type { ServiceConfiguration } from '../src/config';
import type { TemplateGateway } from '../src/sendgrid/templates';

export const CONFIG: ServiceConfiguration = {
  sendGridApiKey: 'SG.secret-key-value',
  dataResidency: 'global',
  cloudIdentifier: 'gcp-eu',
  entryPointUriPath: 'acme-transactional-messaging',
  audience: 'https://service.example.com',
};

export const TEMPLATE_ID = 'd-0123456789abcdef0123456789abcdef';

export const fakeGateway = (): jest.Mocked<TemplateGateway> => ({
  list: jest.fn().mockResolvedValue([]),
  get: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn().mockResolvedValue(undefined),
});

/** Stands in for the token check: the session is whatever the test says it is. */
export const withSession =
  (userPermissions: string[]): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    req.session = { userId: 'user-1', projectKey: 'test-project', userPermissions };
    next();
  };

export const MANAGER = ['canManageAcmeTransactionalMessaging'];
export const VIEWER = ['canViewAcmeTransactionalMessaging'];

export const appWith = (
  gateway: TemplateGateway,
  permissions: string[] = MANAGER
) => createApp(CONFIG, gateway, withSession(permissions));
