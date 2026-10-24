import type { CollectionConfig } from 'payload'

import { authenticated, getUserTenantIDs, isSuperAdmin, superAdminOnly } from '@/access'

// Empresa. The multi-tenant plugin limits reads to the Usuario's own Empresas.
export const Tenants: CollectionConfig = {
  slug: 'tenants',
  labels: { singular: 'Empresa', plural: 'Empresas' },
  admin: { useAsTitle: 'name' },
  access: {
    create: superAdminOnly,
    delete: superAdminOnly,
    read: authenticated,
    update: ({ req }) =>
      isSuperAdmin(req.user) || { id: { in: getUserTenantIDs(req.user, 'administrador') } },
  },
  fields: [{ name: 'name', type: 'text', label: 'Nombre', required: true }],
}
