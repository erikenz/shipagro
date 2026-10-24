import type { Access } from 'payload'

import type { Tenant, User } from '@/payload-types'

export type TenantRole = NonNullable<User['tenants']>[number]['role']

export const isSuperAdmin = (user: User | null | undefined): boolean => Boolean(user?.superAdmin)

export const superAdminOnly: Access = ({ req }) => isSuperAdmin(req.user)

export const authenticated: Access = ({ req }) => Boolean(req.user)

/** IDs of the Empresas a Usuario belongs to, optionally only those where they hold `role`. */
export const getUserTenantIDs = (user: User | null | undefined, role?: TenantRole): Tenant['id'][] =>
  (user?.tenants ?? []).flatMap((row) =>
    row.tenant && (!role || row.role === role)
      ? [typeof row.tenant === 'object' ? row.tenant.id : row.tenant]
      : [],
  )
