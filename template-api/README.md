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
| `CLOUD_IDENTIFIER` | yes | Same value as the Merchant Center application, for example `gcp-eu`. |
| `ENTRY_POINT_URI_PATH` | yes | Same value as the Merchant Center application. Decides the permission names. |
| `SENDGRID_DATA_RESIDENCY` | no | `global` (default) or `eu`. |
| `TEMPLATE_API_PUBLIC_URL` | no | Overrides the address used as the token audience. By default the origin of `CONNECT_SERVICE_URL` is used. |

Connect injects `CTP_*` and `CONNECT_SERVICE_URL`. The `CTP_*` client is only used by the post-deploy script.

## Develop

```bash
cp .env.example .env
npm install
npm test
npm run start:dev
```

A real token only comes from the Merchant Center, so local runs are mainly useful for the unit tests. They cover the routes, the permission checks, SendGrid paging and error mapping.
