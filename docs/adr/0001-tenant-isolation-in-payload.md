# Tenant isolation lives in Payload, not in Postgres

All Empresas share one Postgres schema. Every row an Empresa owns carries its tenant, and Payload's multi-tenant plugin plus our access rules keep Empresas apart. Wherever Postgres is hosted (Supabase is the planned host), it is only a database: Payload owns login, roles and access control and connects as a privileged role, so Supabase Auth, Row Level Security and the Data API are not used. We chose this because no customer needs physically separate data, and Payload gives us auth, roles, an admin UI and tenant scoping that RLS or a database per Empresa would make us build by hand.

## Consequences

- Server code that runs as the system with `overrideAccess` (the price feed, seed scripts) skips access control, tenant filters included. It must scope every read and write to an Empresa itself, and a test checks that one Empresa can't see another's data.
- The plugin's `cleanupAfterTenantDelete` is turned off: removing an Empresa is a deliberate, audited operation, not a side effect of deleting a row.
