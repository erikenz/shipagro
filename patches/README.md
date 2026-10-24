# Payload import transaction isolation

`@payloadcms/plugin-import-export@3.92.0.patch` gives each import batch its own
Payload data loader as well as its own transaction ID. The stock batch processor
isolates only the ID. Its inherited data loader captures the parent request and
changes that request's transaction ID while resolving relationships. The plugin
then fails to find its uncommitted import result, returning 201 while leaving no
result record in Postgres.

Keep this patch until an upstream version isolates both properties. It is applied
by pnpm through `patchedDependencies` in `pnpm-workspace.yaml`.

Browser regression check against local Postgres, as an Administrador:

1. Import a Contactos CSV with `name,type,locality` and one valid row, leaving
   `tenant` out. Expect one imported Contacto in the selected Empresa and a
   persisted Importación with status `completed` and `summary.imported = 1`.
2. Import a row explicitly naming another Empresa's `tenant`. Expect no new
   Contacto and a persisted Importación with status `failed`, a row error and
   `summary.imported = 0`.
3. Log in as a Usuario of the other Empresa. Reading either Importación or its
   uploaded CSV must fail. Import/export artifacts use the same tenant isolation
   as Contactos; the import-export plugin must run before the multi-tenant plugin.
