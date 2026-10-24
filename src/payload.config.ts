import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { importExportPlugin } from '@payloadcms/plugin-import-export'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { es } from '@payloadcms/translations/languages/es'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { isSuperAdmin } from './access'
import { Alerts } from './collections/Alerts'
import { Contacts } from './collections/Contacts'
import { Instruments } from './collections/Instruments'
import { Operations } from './collections/Operations'
import { PriceTriggers } from './collections/PriceTriggers'
import { Quotes } from './collections/Quotes'
import { Tenants } from './collections/Tenants'
import { Users } from './collections/Users'
import { FeedStatus } from './globals/FeedStatus'
import type { Config } from './payload-types'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Without SMTP_HOST, development email goes to ethereal.email (inbox login in the console).
const smtp = process.env.SMTP_HOST
  ? {
      defaultFromAddress: process.env.SMTP_FROM || 'alertas@shipagro.local',
      defaultFromName: 'ShipAgro',
      transportOptions: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      },
    }
  : undefined

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' · ShipAgro' },
    components: {
      graphics: { Icon: '/graphics/Icon', Logo: '/graphics/Logo' },
      beforeDashboard: ['/dashboard/Pendientes', '/dashboard/AlertasAbiertas', '/dashboard/EstadoFeed'],
    },
  },
  collections: [Tenants, Users, Contacts, Operations, PriceTriggers, Alerts, Instruments, Quotes],
  globals: [FeedStatus],
  i18n: { fallbackLanguage: 'es', supportedLanguages: { es } },
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URL || '' } }),
  // Tests run without an email adapter so they never reach the network.
  email: process.env.NODE_ENV === 'test' ? undefined : nodemailerAdapter(smtp),
  plugins: [
    // Register file/result collections before multi-tenant adds its access rules.
    importExportPlugin({
      overrideImportCollection: ({ collection }) => ({
        ...collection,
        labels: { singular: 'Importación', plural: 'Importaciones' },
      }),
      overrideExportCollection: ({ collection }) => ({
        ...collection,
        labels: { singular: 'Exportación', plural: 'Exportaciones' },
      }),
      collections: [
        { slug: 'contacts', export: { disableJobsQueue: true }, import: { disableJobsQueue: true } },
        { slug: 'operations', export: { disableJobsQueue: true }, import: { disableJobsQueue: true } },
      ],
    }),
    multiTenantPlugin<Config>({
      collections: { alerts: {}, contacts: {}, operations: {}, 'price-triggers': {}, imports: {}, exports: {} },
      // ADR 0001: removing an Empresa is a deliberate operation, not a side effect.
      cleanupAfterTenantDelete: false,
      tenantsArrayField: { includeDefaultField: false },
      userHasAccessToAllTenants: (user) => isSuperAdmin(user),
      i18n: {
        translations: {
          es: {
            'assign-tenant-button-label': 'Asignar empresa',
            'assign-tenant-modal-title': 'Asignar "{{title}}"',
            'field-assignedTenant-label': 'Empresa asignada',
            'nav-tenantSelector-label': 'Empresa',
          },
        },
      },
    }),
  ],
})
