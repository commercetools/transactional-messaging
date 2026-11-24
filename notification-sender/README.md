# notification-sender

The Connect event application of transactional-messaging. It receives commercetools messages through a Subscription, and sends an email (SendGrid) and an SMS (Twilio) for each notification the merchant has enabled. The root [README](../README.md) describes the notifications, configuration and delivery behaviour.

## Local development

```bash
cd notification-sender
npm ci
cp .env.example .env     # fill in a sandbox Project and your own test recipients
npm run build
npm start                # listens on http://localhost:8080
```

`npm start` refuses to start when the configuration is wrong, and the error names the missing key.

| Script | What it does |
|---|---|
| `npm run build` | Compiles to `build/` (what Connect runs). |
| `npm start` / `npm run start:dev` | Runs the built app, or watches and restarts it. |
| `npm test` | Unit tests. They need no credentials. |
| `npm run typecheck`, `npm run lint` | Checks. |
| `npm run connector:post-deploy` | Creates or updates the Subscription and checks provider credentials. Connect runs it. |
| `npm run connector:pre-undeploy` | Removes the Subscription. Connect runs it. |

Endpoints:

- `POST /notificationSender`: the Pub/Sub push endpoint. The body is `{"message":{"data":"<base64 of the commercetools message>"}}`.
- `GET /notificationSender/health`: returns `{"status":"ok"}`.

Acknowledgements: `204` when a channel sent, `200` for messages we ignore or cannot retry, `503` when a transient failure should be redelivered.

## Trying a message locally

Post a message to the running app. Use a real order ID from your sandbox Project and your own addresses:

```bash
DATA=$(printf '%s' '{"notificationType":"Message","projectKey":"<project-key>","id":"11111111-1111-4111-8111-111111111111","version":1,"sequenceNumber":1,"resource":{"typeId":"order","id":"<order-id>"},"resourceVersion":1,"type":"OrderCreated","createdAt":"2026-01-01T00:00:00.000Z","lastModifiedAt":"2026-01-01T00:00:00.000Z","createdBy":{"clientId":"storefront"},"lastModifiedBy":{"clientId":"storefront"}}' | base64 | tr -d '\n')
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8080/notificationSender \
  -H 'content-type: application/json' -d "{\"message\":{\"data\":\"$DATA\"}}"
```

The connector re-fetches the order by `resource.id`, so the payload need not be complete. Expect `204`.

## Layout

| Folder | Contents |
|---|---|
| `src/controllers/` | The event endpoint and the acknowledgement rules. |
| `src/handlers/` | One handler per message type. Each returns a channel-agnostic notification context. |
| `src/notifications/` | The notification registry, template resolution, SMS consent and the dispatcher. |
| `src/providers/` | The SendGrid and Twilio providers, and their error classification. |
| `src/mappings/` | Loading the merchant's mappings from Custom Objects. |
| `src/sms/` | SMS rendering, phone number normalisation. |
| `src/connector/` | Subscription management and the deployment checks. |

Logs carry identifiers only. Don't add email addresses, phone numbers, names or message bodies to log lines.
