import type { Access, CollectionConfig, Where } from 'payload'

import { tenantsArrayField } from '@payloadcms/plugin-multi-tenant/fields'

import { getUserTenantIDs, isSuperAdmin } from '@/access'
import { TENANT_ROLES } from '@/domain'
import type { User } from '@/payload-types'

const isAdministrador = (user: User | null | undefined) =>
  getUserTenantIDs(user, 'administrador').length > 0

// Each row links the Usuario to one Empresa with a role there.
const tenants = tenantsArrayField({
  tenantsArrayFieldName: 'tenants',
  tenantsArrayTenantFieldName: 'tenant',
  tenantsCollectionSlug: 'tenants',
  arrayFieldAccess: {
    create: ({ req }) => isSuperAdmin(req.user) || isAdministrador(req.user),
    update: ({ req }) => isSuperAdmin(req.user) || isAdministrador(req.user),
  },
  tenantFieldAccess: {},
  rowFields: [
    {
      name: 'role',
      type: 'select',
      label: 'Rol',
      options: TENANT_ROLES,
      defaultValue: 'comercial',
      required: true,
    },
  ],
})

// Administradores may create Usuarios only inside the Empresas they administer.
const create: Access = ({ req, data }) => {
  if (isSuperAdmin(req.user)) return true
  const allowed = getUserTenantIDs(req.user, 'administrador')
  const requested: unknown[] = (data?.tenants ?? []).map((row: { tenant: unknown }) => row.tenant)
  return allowed.length > 0 && requested.every((id) => allowed.includes(id as number))
}

// Everyone sees the Usuarios of their own Empresas (to pick a Responsable).
const read: Access = ({ req }) => {
  if (!req.user) return false
  if (isSuperAdmin(req.user)) return true
  return {
    or: [
      { id: { equals: req.user.id } },
      { 'tenants.tenant': { in: getUserTenantIDs(req.user) } },
    ],
  } as Where
}

const updateOrDelete: Access = ({ req, id }) => {
  if (!req.user) return false
  if (isSuperAdmin(req.user) || req.user.id === id) return true
  return { 'tenants.tenant': { in: getUserTenantIDs(req.user, 'administrador') } }
}

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Usuario', plural: 'Usuarios' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'email'] },
  auth: true,
  access: { create, read, update: updateOrDelete, delete: updateOrDelete },
  fields: [
    { name: 'name', type: 'text', label: 'Nombre', required: true },
    {
      name: 'superAdmin',
      type: 'checkbox',
      label: 'Super-admin de la plataforma',
      defaultValue: false,
      access: {
        create: ({ req }) => isSuperAdmin(req.user),
        update: ({ req }) => isSuperAdmin(req.user),
      },
      admin: { position: 'sidebar' },
    },
    { ...tenants, label: 'Empresas', admin: { ...tenants.admin, position: 'sidebar' } },
  ],
}
