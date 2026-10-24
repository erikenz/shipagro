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
- Tests live in `tests/**/*.spec.ts` (vitest, Node). Integration tests use the database in `DATABASE_URL`, create their own data with unique names, and delete it afterwards.
- After changing fields or admin components, run `pnpm generate:types` / `pnpm generate:importmap` and commit the result. On a merge conflict in those generated files, regenerate them.
- Done means `pnpm typecheck`, `pnpm lint` and `pnpm test` pass.

## Feature ownership

Four features are built in parallel on separate branches, each tracked in a GitHub issue. Edit the files your feature owns. Touch shared files only when unavoidable, with small additive edits, and say so in the PR.

| Feature | Owns |
|---|---|
| Feed | `src/feed/**`, `src/collections/Instruments.ts`, `src/globals/FeedStatus.ts` |
| Alertas | `src/alerts/**`, `src/collections/PriceTriggers.ts`, `src/collections/Alerts.ts`, `src/collections/Quotes.ts` |
| Seguimiento | `src/pendientes/**`, `src/dashboard/**`, `src/collections/Operations.ts` |
| Datos y acceso | `src/seed/**`, `src/access/**`, `src/collections/Users.ts`, `src/collections/Tenants.ts`, `src/collections/Contacts.ts`, `src/graphics/**`, `src/app/(payload)/custom.scss`, `docs/import/**`, `docs/demo.md` |
| Shared | `src/payload.config.ts`, `src/domain.ts`, `src/fields/**`, `package.json`, generated files |

## Running in v0

The v0 sandbox has no Docker, so it uses a hosted Postgres instead of `docker-compose.yml`:

1. Connect Neon under Project Settings > Integrations; it sets `DATABASE_URL`.
2. Add `PAYLOAD_SECRET` (any long random string) under Environment Variables as a non-sensitive variable; v0 can't read sensitive ones. The Feed also needs `A3_USERNAME` and `A3_PASSWORD`.
3. Run `pnpm seed`, then use the logins it prints.
