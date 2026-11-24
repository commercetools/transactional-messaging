# Contributing

Thanks for wanting to improve transactional-messaging. Small, focused pull requests are easiest to review.

Please note the response times in [SUPPORT.md](./SUPPORT.md): this is a labs project, so reviews happen when we can.

## Local setup

- Node.js 22 or 24. The `.nvmrc` files pin the version.
- From the repository root, run `npm run install:apps`. It installs the applications from their lockfiles.
- Copy each `.env.example` to `.env` and fill it in for local runs. Never commit `.env`. Tests do not need credentials.

## Checks a pull request must pass

```bash
npm run preflight
```

This runs the typecheck, the tests, the critical-severity audit and the Connect build of each application.

`commercetools connect validate` must also pass before a change to `connect.yaml` or to the connector's dependencies. It needs Docker.

## Coding rules

- TypeScript with strict typing. Don't use `any` or `@ts-ignore` to make something compile. Use `unknown` and narrow it.
- Logs never contain personal data (email addresses, phone numbers, names) or message bodies. Log IDs and the notification key.
- The Merchant Center app is built with Nimbus only. Don't add `@commercetools-uikit` packages.
- Shared files (the SMS renderer, the notification keys and the template schema) are edited in `notification-sender/src` only. Then run `npm run sync:shared`. `npm run check:shared` must pass.
- Keep lockfiles in step with `package.json`. Commit the regenerated lockfile with the dependency change.
- Use Conventional Commit messages, for example `fix(notification-sender): ...`.

## Pull requests

- Describe what changed and why, and how you tested it.
- Keep a change to one concern. Separate refactors from behaviour changes.
- For behaviour changes to message delivery, describe the expected outcome for each channel and the response code.
