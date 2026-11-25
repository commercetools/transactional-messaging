# transactional-messaging

Send the messages a shop owes its customers (order confirmations, shipping and status updates, return notices, welcome and password reset emails) by email through Twilio SendGrid and by SMS through Twilio, straight from your commercetools Project.

It is for commercetools teams who want transactional email and SMS without building the plumbing or asking a developer for every wording change. A Connect application listens to commercetools messages and sends the notification. A Merchant Center application gives merchandisers the rest: they design email templates in MJML with a live preview and sample data, write SMS texts, reuse blocks such as headers and footers across templates, choose which template each notification uses, switch channels on or off, and translate the texts, all without a deployment.

When it runs, a customer who places an order gets a confirmation email with their line items and shipping address, in their language, and an SMS if they gave a mobile number and you enabled SMS.

This is a commercetools-labs project: freely available and shared as-is, and it is unsupported, so commercetools support does not cover it. See [SUPPORT.md](./SUPPORT.md).

## How it works

```
commercetools Project
 ├─ Subscription "transactional-messaging-subscription" ─► Connect event app: notification-sender
 │                                                            1. decode and validate the message
 │                                                            2. re-fetch the order or customer
 │                                                            3. load mappings (Custom Objects) and translations
 │                                                            ├─► email: SendGrid dynamic template
 │                                                            └─► sms:   text of a SendGrid template ─► Handlebars ─► Twilio Messaging
 ├─ Custom Objects
 │   ├─ notification-mappings    one object per notification and channel: which SendGrid template to send
 │   ├─ notification-template-sources   the MJML a template was built from, so it can be edited again
 │   ├─ notification-template-parts     reusable MJML blocks that templates include
 │   ├─ localizations / transactional-emails   translations used as {{messages.<key>}}
 │   └─ transactional-messaging / template-api   URL of the template service
 ├─ Connect service app: template-api (reads and writes SendGrid templates for the Merchant Center)
 └─ Merchant Center custom application: notification-manager (Templates, Mappings and Localizations)
```

### Notifications

Each notification is triggered by the commercetools messages below. Subscriptions deliver these at least once and without ordering.

| Notification | Triggered by | Sent to |
|---|---|---|
| Customer registration | `CustomerCreated` | the customer |
| Password reset | `CustomerPasswordTokenCreated` | the customer |
| Order confirmation | `OrderCreated`, `OrderImported` | the customer |
| Order status update | `OrderStateChanged`, `OrderStateTransition` | the customer |
| Shipping update | `OrderShipmentStateChanged` | the customer |
| Return / refund | `ReturnInfoAdded`, `ReturnInfoSet` | the customer |

**Order status and shipping updates are sent on every state transition.** There is no per-state filter. If you only want some transitions, disable the template for that notification in the Merchant Center, or extend the connector.

SMS is billed by Twilio per segment. The Merchant Center shows an estimate of the segments for each message.

## Prerequisites

- A commercetools Project.
- A Twilio SendGrid account with a verified sender address and dynamic templates, for email.
- A Twilio account with an API key and a Messaging Service, for SMS. A single sender phone number also works.
- Node.js 22 or 24 for local development.

## Install with Connect

1. Create a connector from this repository in the Connect section of your Project. Follow the [Connect documentation](https://docs.commercetools.com/connect).
2. Register the Merchant Center custom application **first**, so its ID is available for the deployment. See [Merchant Center custom applications](https://docs.commercetools.com/merchant-center-customizations/custom-applications).
3. Deploy the connector with the configuration below.
4. Point the custom application URL at the deployment, and install it in the Merchant Center.

Connect creates the API client from the scopes in `connect.yaml`, and creates the Subscription on deployment.

## Configuration

These are the keys in [connect.yaml](./connect.yaml). The configuration is set in the Connect deployment.

| Key | Application | Secured | Required | Description |
|---|---|---|---|---|
| `DEFAULT_LOCALE` | notification-sender | no | yes (default `en-US`) | Locale used when neither the customer nor the order has one. Used to format dates and prices. |
| `SENDER_EMAIL_ADDRESS` | notification-sender | no | to enable email | Verified sender address in Twilio SendGrid. Email is enabled only when this and `SENDGRID_API_KEY` are both set. |
| `SENDGRID_DATA_RESIDENCY` | notification-sender | no | no (default `global`) | `global` or `eu`, for SendGrid EU regional subusers. |
| `TWILIO_ACCOUNT_SID` | notification-sender | no | to enable SMS | Twilio Account SID (`AC…`). |
| `TWILIO_MESSAGING_SERVICE_SID` | notification-sender | no | one of this or `TWILIO_FROM_NUMBER` for SMS | Messaging Service SID (`MG…`). Recommended. |
| `TWILIO_FROM_NUMBER` | notification-sender | no | one of this or `TWILIO_MESSAGING_SERVICE_SID` for SMS | Sender number in E.164, for example `+15551234567`. |
| `SMS_CONSENT_CUSTOM_FIELD` | notification-sender | no | no | Name of a boolean Custom Field on Customer (or Order, for guests). When set, an SMS is sent only if it is `true`. See [SMS consent](#sms-consent). |
| `SENDGRID_API_KEY` | notification-sender | yes | to enable email or SMS | SendGrid API key. Needs `mail.send` for email and `templates.read` for SMS, because SMS texts are SendGrid templates. Checked at deployment. |
| `TWILIO_API_KEY_SID` | notification-sender | yes | to enable SMS | Twilio API Key SID (`SK…`). Checked at deployment. |
| `TWILIO_API_KEY_SECRET` | notification-sender | yes | to enable SMS | Twilio API Key secret. |
| `SENDGRID_API_KEY` | template-api | yes | yes | SendGrid API key with the Template Engine read and write permissions, for the Templates page. Use the same SendGrid account as the notification-sender; one key with `mail.send` and Template Engine read and write can serve both. |
| `CLOUD_IDENTIFIER` | template-api | no | yes (default `gcp-eu`) | Same value as for notification-manager. Used to check the Merchant Center token. |
| `ENTRY_POINT_URI_PATH` | template-api | no | yes | Same value as for notification-manager. It decides which View and Manage permissions the service checks. |
| `SENDGRID_DATA_RESIDENCY` | template-api | no | no (default `global`) | Same value as for notification-sender. |
| `TEMPLATE_API_PUBLIC_URL` | template-api | no | no | Public https URL of the service, used as the token audience. Leave empty to use the URL Connect assigns. |
| `CUSTOM_APPLICATION_ID` | notification-manager | no | yes | The ID shown when you register the custom application. |
| `CLOUD_IDENTIFIER` | notification-manager | no | yes (default `gcp-eu`) | Cloud Region of your Project, for example `gcp-eu`, `gcp-us`, `aws-eu`. |
| `ENTRY_POINT_URI_PATH` | notification-manager | no | yes | Entry point path chosen at registration. It must be globally unique, for example `<company>-transactional-messaging`. |

Connect sets the application URL of notification-manager (`APPLICATION_URL`) and the `CTP_*` API client itself; they are not in `connect.yaml`. The `*_DEV_*` settings in the `.env.example` files are for local development only and are refused in a deployment.

At least one channel must be complete: email (`SENDGRID_API_KEY` and `SENDER_EMAIL_ADDRESS`), or SMS (the three Twilio credentials, a sender, and `SENDGRID_API_KEY` for the texts). A partly configured channel stops the connector at startup, and the error names the missing key.

## Scopes

Connect grants the notification-sender these scopes through `inheritAs.apiClient`:

| Scope | Why |
|---|---|
| `manage_customers` | Read the customer, and create the email verification token on registration. Creates a password reset token only when the message does not carry one. |
| `view_orders` | Re-fetch the order from the message. |
| `view_states` | Resolve the names of custom order states. |
| `manage_key_value_documents` | The notification-sender reads the mappings and translations from Custom Objects. The template-api post-deploy script writes its URL to a Custom Object. |
| `view_project_settings` | Read the project languages, for localized text. |
| `manage_subscriptions` | Create and update the Subscription during deployment. |

The Merchant Center custom application uses `view_key_value_documents` and `manage_key_value_documents`, so merchants with the Manage permission can edit templates, mappings and translations.

## Templates and mappings

Templates are managed in Merchant Center → **Templates**. Email and SMS templates live in SendGrid; parts live in the Merchant Center:

- **Email:** a SendGrid dynamic template, written as MJML with a live preview. The Merchant Center compiles the MJML and stores the HTML in SendGrid. The MJML is kept in the `notification-template-sources` Custom Objects so the template can be edited again.
- **SMS:** a SendGrid dynamic template whose name starts with `[SMS] ` and whose text is the active version's plain text, written as Handlebars. People never type the prefix; the template service adds and removes it.
- Templates that were created in SendGrid's own editor are listed read-only, labelled "Created in SendGrid".
- **Part:** a reusable block of MJML, such as a header, a footer or an order summary, bound to one notification so it can use that notification's variables. An email template or another part includes it with `<mj-include path="<key>.mjml" />`; the **Insert a part** list in the editor writes the tag and offers the parts of the same notification. Parts are stored in the `notification-template-parts` Custom Objects, not in SendGrid, and have no subject.

SendGrid has no includes, so the Merchant Center copies each part into the template when it compiles the MJML. **Saving a part saves again, in SendGrid, every template that uses it**, directly or through another part, and reports any template it could not update. A part cannot be deleted while a template or another part includes it.

Each notification and channel has at most one **mapping**, stored as a Custom Object with the key `<notification>-<channel>`, for example `order-confirmation-sms`. In Merchant Center → **Mappings** you pick the SendGrid template from a list filtered by type, and switch the mapping on or off. A disabled mapping sends nothing for that channel, and **a notification without a mapping sends nothing on that channel**.

SMS texts are read from SendGrid when a message is sent and cached for five minutes, so an edit reaches SMS within that time. If SendGrid is briefly unreachable, the last text is used.

The template service (`template-api/`) is a Connect `service` application. The Merchant Center reaches it through the Merchant Center proxy, which signs each request. Its post-deploy script stores its URL in the `transactional-messaging / template-api` Custom Object. See [template-api/README.md](./template-api/README.md).

### Translations

Translated texts are managed in Merchant Center → **Localizations**. The connector reads one **translation set**, the one with the key `transactional-emails` (Custom Object `localizations` / `transactional-emails`). Without it, the built-in texts are used. Other sets are listed but not used.

A set has one group of texts per **message type**, the commercetools message that triggers a notification:

| Message type | Notification |
|---|---|
| `CustomerCreated` | Customer registration |
| `CustomerPasswordTokenCreated` | Password reset |
| `OrderCreated` | Order confirmation |
| `OrderStateChanged` | Order status update |
| `OrderShipmentStateChanged` | Shipping update |
| `ReturnInfoAdded` | Return / refund |

Each text has a **variable name** and a translation per language. A text named `trackingIntro` in the `OrderCreated` group is available to order confirmation templates as `{{messages.trackingIntro}}`, and appears in the editor's variable list. The connector picks the customer's or order's language and falls back to the other project languages. Changes apply to the next message, without a deployment. Renaming or deleting a text does not change templates that use it; the variable then renders empty.

### Variables

Every template receives the variables below, plus its translations as `{{messages.<name>}}`.

| Notification | Variables |
|---|---|
| All order notifications | `orderNumber`, `customerEmail`, `customerFirstName`, `customerLastName`, `orderCreationDate`, `orderCreationTime`, `orderTotalPrice`, `orderTaxedPrice` |
| Order confirmation | the above, plus `orderLineItems` (each: `productName`, `productQuantity`, `productSku`, `productImage`, `productSubTotal`) and `shippingAddress` (`firstName`, `lastName`, `company`, `streetName`, `streetNumber`, `additionalStreetInfo`, `postalCode`, `city`, `state`, `country`) |
| Order status update | the common fields, plus `orderState`, `oldOrderState` |
| Shipping update | the common fields, plus `shipmentState`, `oldShipmentState` |
| Return / refund | the common fields, plus `orderState`, `orderShipmentState`, `orderLineItems` (returned items only) |
| Customer registration | `customerEmail`, `customerNumber`, `customerFirstName`, `customerLastName`, `customerCreationDate`, `customerCreationTime`, and when the email is not verified yet, `customerEmailToken`, `customerEmailTokenValidityDate`, `customerEmailTokenValidityTime` |
| Password reset | `customerEmail`, `customerNumber`, `customerFirstName`, `customerLastName`, `customerCreationDate`, `customerCreationTime`, `customerPasswordToken`, `customerPasswordTokenValidityDate`, `customerPasswordTokenValidityTime` |

## Delivery behaviour

Each message is processed once per delivery. The email and SMS channels are sent independently.

- **Both channels fail transiently** (network error, timeout, HTTP 429 or 5xx from SendGrid or Twilio): the connector responds 503, and the broker redelivers. A message the provider accepted but whose response timed out can be sent twice. This is at-least-once delivery.
- **One channel sends and the other fails transiently:** the connector responds 204. The failed channel is **not** retried, so it is logged at `error` with the message ID so an operator can follow up. This is at-most-once for that channel.
- **Permanent failures** (for example an invalid phone number, an opted-out recipient, or a rejected SendGrid request) are logged and not retried. Retrying cannot help, and an endless retry would block the queue.
- **Provider timeouts** are set inside the acknowledgement window of the event (about 10 seconds).

If SendGrid or Twilio is down, messages are retried while nothing has been delivered for that message. Messages that were delivered by one channel are not sent again.

## SMS consent

Transactional SMS still needs a lawful basis in many countries. Set `SMS_CONSENT_CUSTOM_FIELD` to the name of a boolean Custom Field on Customer. The connector sends an SMS only when the customer's field is `true`. For guest orders it checks the order's field.

If you leave `SMS_CONSENT_CUSTOM_FIELD` unset, the connector does not check consent. **In that case you are responsible for having consent before enabling an SMS template.**

## Operations

### Logs

The connector writes one log line per channel outcome, with these fields:

| Field | Meaning |
|---|---|
| `messageId` | ID of the commercetools message. |
| `resourceId` | ID of the order or customer. |
| `notification` | Notification key, for example `order-confirmation`. |
| `channel` | `email` or `sms`. |
| `status` | `sent`, `skipped` or `failed`. |
| `reason` | Why a channel was skipped or failed, for example `no-template`, `no-consent`, or the provider status. |
| `providerId` | Twilio message SID, for `sent` SMS messages. |

Logs never contain email addresses, phone numbers, names, tokens or message bodies.

Deployment logs are available in the Connect section of your Project. See the [Connect documentation](https://docs.commercetools.com/connect).

### Poison messages

A message that cannot be processed, for example an invalid envelope or a message about an order that no longer exists, is acknowledged and logged. It is never retried endlessly. Find it by searching the logs for `messageId`.

### Replay

The connector stores no messages. To send a notification again, trigger the business event again (for example, change the order state), or send the message yourself through SendGrid or Twilio. A replay sends the message again, including to a customer who already received it.

## Upgrading from sendgrid-integration

These changes are breaking. Plan the switch before you deploy.

- The application is renamed: `mail-sender` is now `notification-sender`, with the endpoint `/notificationSender`.
- `EMAIL_PROVIDER_API_KEY` is now `SENDGRID_API_KEY`.
- The `CTP_*` keys are removed. Connect provides the API client through `inheritAs.apiClient`.
- The Subscription key is `transactional-messaging-subscription`. **Undeploy the old connector first, or both will send each message.**
- Password reset tokens minted by the connector now expire after 60 minutes.
- The `*_TEMPLATE_ID` settings are removed. Templates and mappings are managed in the Merchant Center, and a notification without an email mapping sends no email. **Before you deploy, create an email mapping for each notification you send**, pointing at the SendGrid template you used before (Merchant Center → Mappings lists every SendGrid template).
- Email and SMS texts are SendGrid templates. SMS needs `SENDGRID_API_KEY` with the `templates.read` permission, even when the email channel is off.
- The `templates/` command-line tool is gone. Its MJML designs and SMS texts are the defaults in the Merchant Center Templates form.

## Local development

| Application | Folder | Guide |
|---|---|---|
| Connect event application | `notification-sender/` | [notification-sender/README.md](./notification-sender/README.md) |
| Merchant Center custom application | `notification-manager/` | [notification-manager/README.md](./notification-manager/README.md) |
| Connect service for SendGrid templates | `template-api/` | [template-api/README.md](./template-api/README.md) |

From the repository root:

```bash
npm run install:apps   # install all applications
npm run typecheck
npm test
npm run preflight      # typecheck, tests, audit and the Connect build
```

Run `commercetools connect validate` before a release. It needs Docker.

To work on the Merchant Center application with a template service on your own machine, run template-api with `TEMPLATE_API_DEV_MODE=true` and notification-manager with `TEMPLATE_API_DEV_URL=http://localhost:8080`. The Merchant Center proxy cannot reach `localhost`, so the application then calls the service directly, without a token. See [template-api/README.md](./template-api/README.md#local-development).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Questions and support expectations are in [SUPPORT.md](./SUPPORT.md).

## License

MIT. See [LICENSE](./LICENSE).
