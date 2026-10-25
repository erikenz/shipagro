import config from '@payload-config'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload, type Where } from 'payload'
import { cache } from 'react'

import { getUserTenantIDs, isSuperAdmin, type TenantRole } from '@/access'
import type { Tenant, User } from '@/payload-types'

/** Same cookie the multi-tenant plugin reads, so the selected Empresa is shared everywhere. */
export const TENANT_COOKIE = 'payload-tenant'

export const getPayloadClient = () => getPayload({ config })

export const getCurrentUser = cache(async () => {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  return { payload, user: (user as (User & { collection: 'users' }) | null) ?? null }
})

export const requireUser = cache(async () => {
  const { payload, user } = await getCurrentUser()
  if (!user) redirect('/login')
  return { payload, user }
})

export type PanelContext = Awaited<ReturnType<typeof getPanelContext>>

/**
 * The signed-in Usuario, the Empresas they can work in, and the selected one. Every page reads
 * and writes data for the selected Empresa only.
 */
export const getPanelContext = cache(async () => {
  const { payload, user } = await requireUser()
  const superAdmin = isSuperAdmin(user)
  const memberIDs = getUserTenantIDs(user)

  const { docs } = await payload.find({
    collection: 'tenants',
    where: superAdmin ? {} : { id: { in: memberIDs } },
    sort: 'name',
    depth: 0,
    pagination: false,
    overrideAccess: false,
    user,
  })
  const tenants: Tenant[] = docs

  const cookieValue = (await cookies()).get(TENANT_COOKIE)?.value
  const tenant = tenants.find((t) => String(t.id) === cookieValue) ?? tenants[0] ?? null

  const role: TenantRole | null =
    (tenant && user.tenants?.find((row) => (typeof row.tenant === 'object' ? row.tenant.id : row.tenant) === tenant.id)?.role) ||
    null

  const tenantWhere: Where = tenant ? { tenant: { equals: tenant.id } } : { id: { equals: -1 } }

  return {
    payload,
    user,
    tenants,
    tenant,
    role,
    superAdmin,
    canManageUsers: superAdmin || role === 'administrador',
    tenantWhere,
    access: { overrideAccess: false as const, user },
  }
})
