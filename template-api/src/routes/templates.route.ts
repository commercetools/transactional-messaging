import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import CustomError from '../errors/custom.error';
import { toHttpError } from '../sendgrid/errors';
import {
  MAX_NAME_LENGTH,
  SMS_PREFIX,
  TEMPLATE_ID_PATTERN,
  type Channel,
  type TemplateGateway,
  type TemplateInput,
  type TemplateSummary,
} from '../sendgrid/templates';
import { requirePermission } from '../middleware/auth.middleware';
import type { ServiceConfiguration } from '../config';

const MAX_HTML_LENGTH = 1_000_000;
const MAX_TEXT_LENGTH = 100_000;
const LIST_CACHE_MS = 60_000;

const isChannel = (value: unknown): value is Channel =>
  value === 'email' || value === 'sms';

const text = (body: Record<string, unknown>, key: string): string => {
  const value = body[key];
  return typeof value === 'string' ? value : '';
};

/** Validates a create or update body. Returns the channel and the cleaned input. */
export const parseTemplateBody = (
  raw: unknown,
  expectedChannel?: Channel
): { channel: Channel; input: TemplateInput } => {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new CustomError(400, 'The request body must be a JSON object.');
  }
  const body = raw as Record<string, unknown>;
  const channel = expectedChannel ?? body.channel;
  if (!isChannel(channel)) {
    throw new CustomError(400, 'channel must be email or sms.');
  }

  const name = text(body, 'name').trim();
  const limit = MAX_NAME_LENGTH - (channel === 'sms' ? SMS_PREFIX.length : 0);
  if (name.length === 0 || name.length > limit) {
    throw new CustomError(400, `name must be 1 to ${limit} characters.`);
  }

  const input: TemplateInput = {
    name,
    subject: text(body, 'subject').trim(),
    html: text(body, 'html'),
    text: text(body, 'text'),
  };
  if (
    input.html.length > MAX_HTML_LENGTH ||
    input.text.length > MAX_TEXT_LENGTH
  ) {
    throw new CustomError(400, 'The template content is too large.');
  }
  if (channel === 'email' && (!input.subject || !input.html.trim())) {
    throw new CustomError(
      400,
      'An email template needs a subject and an HTML body.'
    );
  }
  if (channel === 'sms' && !input.text.trim()) {
    throw new CustomError(400, 'An SMS template needs a text body.');
  }
  return { channel, input };
};

const idParam = (req: Request): string => {
  const id = String(req.params.id ?? '');
  if (!TEMPLATE_ID_PATTERN.test(id)) {
    throw new CustomError(
      400,
      'The template ID must look like d-0123456789abcdef0123456789abcdef.'
    );
  }
  return id;
};

/** Wraps an async handler so SendGrid failures reach the error middleware as HTTP errors. */
const handle =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch((error: unknown) => next(toHttpError(error)));
  };

export const createTemplatesRouter = (
  gateway: TemplateGateway,
  config: ServiceConfiguration,
  now: () => number = Date.now
): Router => {
  const router = Router();
  const canView = requirePermission(config, 'view');
  const canManage = requirePermission(config, 'manage');

  // The list is the heaviest SendGrid call (many pages), so keep it for a minute and drop it on writes.
  let cached: { at: number; value: TemplateSummary[] } | undefined;
  const invalidate = () => {
    cached = undefined;
  };

  router.get(
    '/templates',
    canView,
    handle(async (req, res) => {
      const filter = req.query.channel;
      if (filter !== undefined && filter !== 'all' && !isChannel(filter)) {
        throw new CustomError(400, 'channel must be email, sms or all.');
      }
      if (!cached || now() - cached.at > LIST_CACHE_MS) {
        cached = { at: now(), value: await gateway.list() };
      }
      const items =
        filter === 'email' || filter === 'sms'
          ? cached.value.filter((item) => item.channel === filter)
          : cached.value;
      res.json({ results: items });
    })
  );

  router.get(
    '/templates/:id',
    canView,
    handle(async (req, res) => {
      res.json(await gateway.get(idParam(req)));
    })
  );

  router.post(
    '/templates',
    canManage,
    handle(async (req, res) => {
      const { channel, input } = parseTemplateBody(req.body);
      const created = await gateway.create(channel, input);
      invalidate();
      res.status(201).json(created);
    })
  );

  router.put(
    '/templates/:id',
    canManage,
    handle(async (req, res) => {
      const id = idParam(req);
      const { channel, input } = parseTemplateBody(req.body);
      const updated = await gateway.update(id, channel, input);
      invalidate();
      res.json(updated);
    })
  );

  router.delete(
    '/templates/:id',
    canManage,
    handle(async (req, res) => {
      await gateway.remove(idParam(req));
      invalidate();
      res.status(204).end();
    })
  );

  return router;
};
