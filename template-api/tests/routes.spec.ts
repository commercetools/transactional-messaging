import request from 'supertest';
import { createApp } from '../src/app';
import CustomError from '../src/errors/custom.error';
import {
  CONFIG,
  MANAGER,
  TEMPLATE_ID,
  VIEWER,
  appWith,
  fakeGateway,
} from './helpers';

const BASE = '/templateApi/templates';
const email = {
  channel: 'email',
  name: 'Order confirmation',
  subject: 'Your order {{orderNumber}}',
  html: '<p>Hi {{customerFirstName}}</p>',
  text: 'Hi',
};
const sms = {
  channel: 'sms',
  name: 'Order SMS',
  text: 'Order {{orderNumber}}',
};

describe('authentication', () => {
  it('rejects a request without a Merchant Center token', async () => {
    const app = createApp(CONFIG, fakeGateway());
    const response = await request(app).get(BASE);
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized.' });
  });

  it('rejects a malformed token with the Merchant Center headers present', async () => {
    const app = createApp(CONFIG, fakeGateway());
    const response = await request(app)
      .get(BASE)
      .set('x-mc-api-cloud-identifier', 'gcp-eu')
      .set('x-mc-api-forward-to-version', 'v2')
      .set('authorization', 'Bearer not-a-jwt');
    expect(response.status).toBe(401);
  });

  it('answers the health probe without a token', async () => {
    const response = await request(createApp(CONFIG, fakeGateway())).get(
      '/templateApi/health'
    );
    expect(response.status).toBe(200);
    expect(JSON.stringify(response.body)).not.toContain('SG.');
  });
});

describe('permissions', () => {
  it('lets a viewer read but not write', async () => {
    const gateway = fakeGateway();
    const app = appWith(gateway, VIEWER);
    expect((await request(app).get(BASE)).status).toBe(200);
    expect((await request(app).post(BASE).send(email)).status).toBe(403);
    expect(
      (await request(app).put(`${BASE}/${TEMPLATE_ID}`).send(email)).status
    ).toBe(403);
    expect((await request(app).delete(`${BASE}/${TEMPLATE_ID}`)).status).toBe(
      403
    );
    expect(gateway.create).not.toHaveBeenCalled();
    expect(gateway.remove).not.toHaveBeenCalled();
  });

  it('rejects a user with no permission for this application', async () => {
    const response = await request(
      appWith(fakeGateway(), ['canViewSomethingElse'])
    ).get(BASE);
    expect(response.status).toBe(403);
  });

  it('matches permission names regardless of case', async () => {
    const response = await request(
      appWith(fakeGateway(), ['CANMANAGEACMETRANSACTIONALMESSAGING'])
    ).delete(`${BASE}/${TEMPLATE_ID}`);
    expect(response.status).toBe(204);
  });
});

describe('GET /templates', () => {
  const summaries = [
    { id: 'd-1', name: 'A', channel: 'email', updatedAt: 'x' },
    { id: 'd-2', name: 'B', channel: 'sms', updatedAt: 'x' },
  ] as const;

  it('filters by channel and serves repeated reads from the cache', async () => {
    const gateway = fakeGateway();
    gateway.list.mockResolvedValue([...summaries]);
    const app = appWith(gateway);
    const smsOnly = await request(app).get(`${BASE}?channel=sms`);
    expect(smsOnly.body.results.map((r: { id: string }) => r.id)).toEqual([
      'd-2',
    ]);
    const all = await request(app).get(BASE);
    expect(all.body.results).toHaveLength(2);
    expect(gateway.list).toHaveBeenCalledTimes(1);
  });

  it('drops the cache after a write', async () => {
    const gateway = fakeGateway();
    gateway.create.mockResolvedValue({
      id: TEMPLATE_ID,
      name: 'x',
      channel: 'sms',
      updatedAt: 'x',
      subject: '',
      html: '',
      text: 'x',
    });
    const app = appWith(gateway);
    await request(app).get(BASE);
    await request(app).post(BASE).send(sms);
    await request(app).get(BASE);
    expect(gateway.list).toHaveBeenCalledTimes(2);
  });

  it('rejects an unknown channel', async () => {
    const response = await request(appWith(fakeGateway())).get(
      `${BASE}?channel=push`
    );
    expect(response.status).toBe(400);
  });
});

describe('writes', () => {
  it('creates an email template', async () => {
    const gateway = fakeGateway();
    gateway.create.mockResolvedValue({
      id: TEMPLATE_ID,
      name: email.name,
      channel: 'email',
      updatedAt: 'x',
      subject: email.subject,
      html: email.html,
      text: '',
    });
    const response = await request(appWith(gateway)).post(BASE).send(email);
    expect(response.status).toBe(201);
    expect(gateway.create).toHaveBeenCalledWith('email', {
      name: 'Order confirmation',
      subject: 'Your order {{orderNumber}}',
      html: '<p>Hi {{customerFirstName}}</p>',
      text: 'Hi',
    });
  });

  it.each([
    ['no channel', { ...email, channel: undefined }],
    ['an unknown channel', { ...email, channel: 'push' }],
    ['an empty name', { ...email, name: '  ' }],
    ['a name that is too long', { ...email, name: 'x'.repeat(101) }],
    ['an email without a subject', { ...email, subject: '' }],
    ['an email without HTML', { ...email, html: ' ' }],
    ['an SMS without text', { ...sms, text: '' }],
    [
      'an SMS name that leaves no room for the prefix',
      { ...sms, name: 'x'.repeat(95) },
    ],
    ['HTML over the size limit', { ...email, html: 'x'.repeat(1_000_001) }],
  ])('rejects %s', async (_label, body) => {
    const gateway = fakeGateway();
    const response = await request(appWith(gateway)).post(BASE).send(body);
    expect(response.status).toBe(400);
    expect(gateway.create).not.toHaveBeenCalled();
  });

  it('rejects a body that is not an object', async () => {
    const response = await request(appWith(fakeGateway()))
      .post(BASE)
      .send([1, 2]);
    expect(response.status).toBe(400);
  });

  it('updates a template and checks the ID format', async () => {
    const gateway = fakeGateway();
    gateway.update.mockResolvedValue({
      id: TEMPLATE_ID,
      name: 'Order SMS',
      channel: 'sms',
      updatedAt: 'x',
      subject: '',
      html: '',
      text: 'x',
    });
    const app = appWith(gateway);
    const ok = await request(app).put(`${BASE}/${TEMPLATE_ID}`).send(sms);
    expect(ok.status).toBe(200);
    expect(gateway.update).toHaveBeenCalledWith(
      TEMPLATE_ID,
      'sms',
      expect.objectContaining({
        name: 'Order SMS',
        text: 'Order {{orderNumber}}',
      })
    );
    const bad = await request(app).put(`${BASE}/not-an-id`).send(sms);
    expect(bad.status).toBe(400);
  });

  it('deletes a template', async () => {
    const gateway = fakeGateway();
    const response = await request(appWith(gateway)).delete(
      `${BASE}/${TEMPLATE_ID}`
    );
    expect(response.status).toBe(204);
    expect(gateway.remove).toHaveBeenCalledWith(TEMPLATE_ID);
  });
});

describe('SendGrid failures', () => {
  const failWith = (code: number, message = 'detail') => {
    const gateway = fakeGateway();
    const error = Object.assign(new Error(`${CONFIG.sendGridApiKey} leaked`), {
      code,
      response: { body: { errors: [{ message }] } },
    });
    gateway.get.mockRejectedValue(error);
    return gateway;
  };

  it.each([
    [404, 404],
    [400, 400],
    [422, 400],
    [401, 502],
    [403, 502],
    [429, 503],
    [500, 502],
  ])('maps SendGrid %i to %i', async (from, to) => {
    const response = await request(appWith(failWith(from))).get(
      `${BASE}/${TEMPLATE_ID}`
    );
    expect(response.status).toBe(to);
  });

  it('never returns the API key', async () => {
    const response = await request(appWith(failWith(500))).get(
      `${BASE}/${TEMPLATE_ID}`
    );
    expect(JSON.stringify(response.body)).not.toContain('secret-key-value');
  });

  it('passes through errors raised by the gateway itself', async () => {
    const gateway = fakeGateway();
    gateway.update.mockRejectedValue(
      new CustomError(400, 'The type of a template cannot be changed.')
    );
    const response = await request(appWith(gateway))
      .put(`${BASE}/${TEMPLATE_ID}`)
      .send(sms);
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('cannot be changed');
  });
});

describe('unknown paths', () => {
  it('returns 404', async () => {
    const response = await request(appWith(fakeGateway(), MANAGER)).get(
      '/nope'
    );
    expect(response.status).toBe(404);
  });
});
