# ShipAgro agent guide

ShipAgro is a hackathon MVP for Argentine grain businesses: a Payload 3.92 + Next.js app whose admin panel is the only UI, plus a feed that reads prices from A3 Mercados' test environment (reMarkets).

Read before changing code:

- `GLOSSARY.md`: the domain terms. Use them in labels, comments and PR text.
- `docs/architecture.md`: the agreed design (modules, trigger rules, Pendientes order, access, feed).
- `docs/adr/`: decisions to keep unless the user reopens them.
- `docs/research/a3-mercados-apis.md`: A3 and reMarkets API facts, for any work on the feed.
- Payload docs for this exact version: https://github.com/payloadcms/payload/tree/v3.92.0/docs

## Conventions

- Collection slugs, field names and identifiers are in English. Option values are the Spanish domain term in kebab-case (`en-entrega`). Every label the admin shows is in Spanish.
- Option lists live in `src/domain.ts`; extend them there.
- Payload 3's Local API skips access control by default. Code acting for a Usuario passes `overrideAccess: false` and `user`. System code (hooks reacting to a Cotización, the feed, the seed) runs with access skipped, so it sets `tenant` explicitly on every document it creates for an Empresa.
- Hooks pass `req` to every Local API call they make, so the work shares one transaction.
- Prefer `fetch`, `Intl` and what Payload already ships over new dependencies.
- After changing fields or admin components, run `pnpm generate:types` / `pnpm generate:importmap` and commit the result; both work without a database. On a merge conflict in those generated files, regenerate them.
- Done means the issue's Build steps are implemented, `pnpm typecheck` passes, and a pull request to `main` is open. This is a hackathon demo, so `pnpm typecheck` is the only check.

## Feature ownership

Four features are built in parallel on separate branches, each tracked in a GitHub issue. Edit the files your feature owns. Touch shared files only when unavoidable, with small additive edits, and say so in the PR.

| Feature | Owns |
|---|---|
| Feed | `src/feed/**`, `src/collections/Instruments.ts`, `src/globals/FeedStatus.ts` |
| Alertas | `src/alerts/**`, `src/collections/PriceTriggers.ts`, `src/collections/Alerts.ts`, `src/collections/Quotes.ts` |
| Seguimiento | `src/pendientes/**`, `src/dashboard/**`, `src/collections/Operations.ts` |
| Datos y acceso | `src/seed/**`, `src/access/**`, `src/collections/Users.ts`, `src/collections/Tenants.ts`, `src/collections/Contacts.ts`, `src/graphics/**`, `src/app/(payload)/custom.scss`, `docs/import/**`, `docs/demo.md` |
| Shared | `src/payload.config.ts`, `src/domain.ts`, `src/fields/**`, `package.json`, generated files |

## Working in v0

v0 chats run without a database, by design: write the code and open a pull request with **Create PR** (Publish would merge into `main` and deploy).

- The v0 preview shows "cannot connect to Postgres". That's expected; leave the database configuration as it is.
- Running the app, the seed and the feed end to end, and checking that the features work together, happens after the pull requests are merged.
