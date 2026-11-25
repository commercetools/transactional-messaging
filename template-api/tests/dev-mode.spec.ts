import request from 'supertest';
import { createApp } from '../src/app';
import { readServiceConfiguration } from '../src/config';
import { CONFIG, fakeGateway } from './helpers';

const DEV = { ...CONFIG, devMode: true, audience: '' };
const MC = 'https://mc.europe-west1.gcp.commercetools.com';
const BASE = '/templateApi/templates';

describe('dev mode', () => {
  it('serves requests without a Merchant Center token, as a manager', async () => {
    const gateway = fakeGateway();
    const app = createApp(DEV, gateway);
    await request(app).get(BASE).expect(200);
    await request(app)
      .delete(`${BASE}/d-0123456789abcdef0123456789abcdef`)
      .expect(204);
  });

  it('answers the preflight from the Merchant Center', async () => {
    const response = await request(createApp(DEV, fakeGateway()))
      .options(BASE)
      .set('Origin', MC)
      .set('Access-Control-Request-Method', 'PUT');
    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe(MC);
    expect(response.headers['access-control-allow-private-network']).toBe(
      'true'
    );
  });

  it('allows the local dev server and adds CORS headers to answers', async () => {
    const response = await request(createApp(DEV, fakeGateway()))
      .get(BASE)
      .set('Origin', 'http://localhost:3001');
    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:3001'
    );
  });

  it.each([
    'https://evil.example.com',
    'https://mc.evil.com',
    'http://localhost.evil.com:3001',
  ])('refuses a browser call from %s', async (origin) => {
    const gateway = fakeGateway();
    const response = await request(createApp(DEV, gateway))
      .get(BASE)
      .set('Origin', origin);
    expect(response.status).toBe(403);
    expect(gateway.list).not.toHaveBeenCalled();
  });

  it('does not skip the token check when dev mode is off', async () => {
    const response = await request(
      createApp({ ...CONFIG, devMode: false }, fakeGateway())
    ).get(BASE);
    expect(response.status).toBe(401);
  });
});

describe('dev mode configuration', () => {
  const env = {
    SENDGRID_API_KEY: 'SG.abc',
    CLOUD_IDENTIFIER: 'gcp-eu',
    ENTRY_POINT_URI_PATH: 'acme-transactional-messaging',
    TEMPLATE_API_DEV_MODE: 'true',
  };

  it('needs no public URL', () => {
    expect(readServiceConfiguration(env)).toMatchObject({
      devMode: true,
      audience: '',
    });
  });

  it('is off unless the value is exactly true', () => {
    expect(
      readServiceConfiguration({
        ...env,
        TEMPLATE_API_DEV_MODE: '1',
        TEMPLATE_API_PUBLIC_URL: 'https://s.example.com',
      }).devMode
    ).toBe(false);
  });

  it.each([
    { NODE_ENV: 'production' },
    { CONNECT_SERVICE_URL: 'https://s.example.com/templateApi' },
  ])('is refused in a deployed service (%j)', (extra) => {
    expect(() => readServiceConfiguration({ ...env, ...extra })).toThrow();
  });
});
