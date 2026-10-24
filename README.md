# ShipAgro

CRM and price alerts for Argentine grain businesses, built as a hackathon MVP. The design is in [docs/architecture.md](docs/architecture.md), the domain terms in [GLOSSARY.md](GLOSSARY.md), and how the work is split across agents in [AGENTS.md](AGENTS.md).

## Run locally

Requires Node 24, pnpm and Docker.

1. `cp .env.example .env` and set `PAYLOAD_SECRET` to a long random string.
2. `docker compose up -d` starts Postgres.
3. `pnpm install`
4. `pnpm seed` wipes the database and loads sample data. Logins, all with password `demo1234`:
   - `admin@shipagro.test`: super-admin, sees every Empresa
   - `ana@pampa.test` (Administrador) and `bruno@pampa.test` (Comercial): Corredora Pampa SA
   - `carla@norte.test` (Administrador) and `diego@norte.test` (Comercial): Acopio del Norte SRL
5. `pnpm dev` and open http://localhost:3000/admin
6. `pnpm feed` in a second terminal reads prices from reMarkets (needs `A3_USERNAME` and `A3_PASSWORD`).
