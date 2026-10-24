import type { CollectionConfig } from 'payload'

import { tenantsArrayField } from '@payloadcms/plugin-multi-tenant/fields'

import { isSuperAdmin } from '@/access'
import {
  canCreateUser,
  canDeleteUser,
  canReadUser,
  canUpdateUser,
  guardUserChange,
  guardUserDelete,
  isAdministrador,
} from '@/access/users'
import { TENANT_ROLES } from '@/domain'

// Each row links the Usuario to one Empresa with a role there. Which rows an
// Administrador may touch is checked by `guardUserChange`.
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

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Usuario', plural: 'Usuarios' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'email'] },
  auth: true,
  access: { create: canCreateUser, read: canReadUser, update: canUpdateUser, delete: canDeleteUser },
  hooks: { beforeChange: [guardUserChange], beforeDelete: [guardUserDelete] },
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
    {
      ...tenants,
      label: 'Empresas',
      labels: { singular: 'Empresa', plural: 'Empresas' },
      admin: { ...tenants.admin, position: 'sidebar' },
    },
  ],
}
