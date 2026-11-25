# template-api

A small Connect `service` that lets the Merchant Center **Templates** page read and write the templates in your Twilio SendGrid account. The browser never talks to SendGrid and never sees the API key.

```
Merchant Center ──/proxy/forward-to──▶ template-api ──▶ SendGrid v3 /templates
```

## How it works

- Every request carries a Merchant Center token. The service verifies it (signature, issuer, audience and expiry) with `@commercetools-backend/express`.
- Reading needs the **View** permission of the Merchant Center application, and writing needs **Manage**. The Merchant Center sends the user's permissions in the token (`X-Forward-To-Claims: permissions`).
- Email templates are SendGrid dynamic templates. SMS templates are SendGrid dynamic templates whose name starts with `[SMS] `, with the text in the active version's `plain_content`. The service adds and removes the prefix, so people never type it.
- After deploy, the service stores its own address in the Custom Object `transactional-messaging` / `template-api`, and the Merchant Center application reads it. Nothing to configure by hand.

## Endpoints

All under `/templateApi`. JSON in, JSON out.

| Method and path | Permission | What it does |
|---|---|---|
| `GET /templates?channel=email\|sms\|all` | View | Lists templates (cached for 60 seconds, cleared by any write). |
| `GET /templates/:id` | View | One template with its subject, HTML and text. |
| `POST /templates` | Manage | Creates a template. Body: `channel`, `name`, and `subject` and `html` (email) or `text` (SMS). |
| `PUT /templates/:id` | Manage | Updates the active version, and renames the template when `name` changed. |
| `DELETE /templates/:id` | Manage | Deletes the template. |
| `GET /health` | none | Liveness. Returns `{ "status": "ok" }`. |

Errors are `{ "message": "…" }`. SendGrid 401 and 403 become 502 ("the API key needs the Template Engine permissions"), SendGrid 429 becomes 503, and the API key is never part of a response.

## Configuration

| Variable | Required | Notes |
|---|---|---|
| `SENDGRID_API_KEY` (secured) | yes | Needs the Template Engine read and write permissions. |
| `CLOUD_IDENTIFIER` | yes | Shared with the Merchant Center application (`inheritAs.configuration` in `connect.yaml`), for example `gcp-eu`. |
| `ENTRY_POINT_URI_PATH` | yes | Same value as the Merchant Center application. Decides the permission names. |
| `SENDGRID_DATA_RESIDENCY` | no | `global` (default) or `eu`. |
| `TEMPLATE_API_PUBLIC_URL` | no | Overrides the address used as the token audience. By default the origin of `CONNECT_SERVICE_URL` is used. |

Connect injects `CTP_*` and `CONNECT_SERVICE_URL`. The `CTP_*` client is only used by the post-deploy script.

Two more variables exist for local development only: `PORT` (default `8080`) and `TEMPLATE_API_DEV_MODE` (below).

## Local development

```bash
cp .env.example .env     # SENDGRID_API_KEY, and CTP_* only if you run the post-deploy script
npm install
npm test
npm run start:dev
```

The unit tests cover the routes, the permission checks, SendGrid paging and error mapping.

A deployed service gets its token from the Merchant Center proxy, and the proxy cannot reach `localhost`. To use the Templates page against a service on your machine, turn on dev mode:

1. In `template-api/.env`, set `TEMPLATE_API_DEV_MODE=true`, then run `npm run start:dev`. The service listens on `127.0.0.1:8080` only, skips the token check, and treats every caller as a user with View and Manage.
2. In `notification-manager/.env`, set `TEMPLATE_API_DEV_URL=http://localhost:8080`, then restart `npm run start:dev`. The application calls the service directly instead of through the proxy.

Dev mode answers only browser requests from the Merchant Center and from `localhost`. It refuses to start when `NODE_ENV=production` or `CONNECT_SERVICE_URL` is set, so it cannot be turned on in a Connect deployment. Your SendGrid account is real: templates you save locally are saved in SendGrid.
