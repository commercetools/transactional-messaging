# notification-manager

The Merchant Center custom application of transactional-messaging. Merchants use it to design **Templates** (email as MJML, SMS as text, both stored in SendGrid), choose the template each notification sends in **Mappings**, and manage **Localizations** (texts used as `{{messages.<key>}}`). It is built with React 19, [Nimbus](https://docs.commercetools.com/merchant-center-customizations/development/nimbus) and the Merchant Center application kit. The root [README](../README.md) describes how it is deployed with Connect.

## Local development

Local development needs a Merchant Center session. Use the development setup of the custom application:

```bash
cd notification-manager
npm ci
cp .env.example .env     # CUSTOM_APPLICATION_ID, ENTRY_POINT_URI_PATH, CLOUD_IDENTIFIER and INITIAL_PROJECT_KEY
npm run start:dev        # the development server opens the Merchant Center
```

The application needs the **View** permission to open, and **Manage** to change templates and localizations. Without Manage, every form is read-only.

| Script | What it does |
|---|---|
| `npm run start:dev` | Development server with the Merchant Center session. |
| `npm run build` | Production build (`public/`). |
| `npm start` | Builds the HTML and serves it on port 8080, as Connect does. |
| `npm test` | Unit tests. |
| `npm run typecheck`, `npm run lint` | Checks. |
| `npm run extract-intl` | Regenerates `src/i18n/data/core.json` from the messages. |

## Notes

- Mappings read and write Custom Objects in the `notification-mappings` container; Localizations use `localizations`. These are the same objects the connector reads.
- Templates are read and written in SendGrid through the `template-api` service, called with the Merchant Center `forward-to` proxy. The service URL is the Custom Object `transactional-messaging/template-api`. The MJML source of each email template is kept in `notification-template-sources`. Parts (reusable MJML that templates pull in with `<mj-include>`) are kept in `notification-template-parts`; the app resolves the includes before it compiles, and saving a part recompiles and saves the templates that use it.
- `src/shared/` holds generated copies of the SMS renderer, the notification keys and the template schema. Don't edit them here. Edit them in `notification-sender/src`, then run `npm run sync:shared` from the repository root.
- Don't add `@commercetools-uikit` packages. The application uses Nimbus only.
