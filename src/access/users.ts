import {
  APIError,
  type Access,
  type CollectionBeforeChangeHook,
  type CollectionBeforeDeleteHook,
  type Where,
} from 'payload'

import type { User } from '@/payload-types'

import { getUserTenantIDs, isSuperAdmin } from './index'

const forbidden = (message: string) => new APIError(message, 403, null, true)

const relationID = (value: unknown): string | undefined => {
  if (value && typeof value === 'object' && 'id' in value) return String((value as { id: unknown }).id)
  return value === null || value === undefined || value === '' ? undefined : String(value)
}

/** A Usuario's `tenants` rows as Empresa ID → role. */
const membership = (rows: unknown): Map<string, string> => {
  const map = new Map<string, string>()
  if (!Array.isArray(rows)) return map
  for (const row of rows as { tenant?: unknown; role?: unknown }[]) {
    const tenantID = relationID(row?.tenant)
    if (tenantID) map.set(tenantID, String(row.role ?? ''))
  }
  return map
}

const administeredIDs = (user: User | null | undefined) =>
  getUserTenantIDs(user, 'administrador').map(String)

export const isAdministrador = (user: User | null | undefined) => administeredIDs(user).length > 0

export const canCreateUser: Access = ({ req }) => isSuperAdmin(req.user) || isAdministrador(req.user)

// Everyone sees the Usuarios of their own Empresas (to pick a Responsable).
export const canReadUser: Access = ({ req }) => {
  if (!req.user) return false
  if (isSuperAdmin(req.user)) return true
  return {
    or: [{ id: { equals: req.user.id } }, { 'tenants.tenant': { in: getUserTenantIDs(req.user) } }],
  } as Where
}

// Anyone edits their own profile; Administradores also edit the Usuarios of their Empresas.
// `guardUserChange` decides which fields each of them may actually change.
export const canUpdateUser: Access = ({ req }) => {
  if (!req.user) return false
  if (isSuperAdmin(req.user)) return true
  const administered = getUserTenantIDs(req.user, 'administrador')
  const self: Where = { id: { equals: req.user.id } }
  return administered.length ? { or: [self, { 'tenants.tenant': { in: administered } }] } : self
}

// Only Administradores delete, never themselves; `guardUserDelete` checks the rest.
export const canDeleteUser: Access = ({ req }) => {
  if (!req.user) return false
  if (isSuperAdmin(req.user)) return true
  const administered = getUserTenantIDs(req.user, 'administrador')
  if (!administered.length) return false
  return {
    and: [{ 'tenants.tenant': { in: administered } }, { id: { not_equals: req.user.id } }],
  } as Where
}

/**
 * Closes what field access can't express: a non-super-admin may only add, remove or
 * re-role `tenants` rows for Empresas where they are Administrador, and never touches
 * `superAdmin`. Rows for other Empresas must come back unchanged. System code (no user) and
 * super-admins pass through.
 */
export const guardUserChange: CollectionBeforeChangeHook<User> = ({ data, operation, originalDoc, req }) => {
  const editor = req.user
  if (!editor || isSuperAdmin(editor)) return data

  if ('superAdmin' in data && Boolean(data.superAdmin) !== Boolean(originalDoc?.superAdmin)) {
    throw forbidden('Solo un super-admin puede cambiar el acceso de super-admin.')
  }

  const administered = administeredIDs(editor)
  if (operation === 'create' && !administered.length) {
    throw forbidden('Solo un Administrador puede crear Usuarios.')
  }

  if (operation === 'create' || 'tenants' in data) {
    const before = membership(operation === 'create' ? [] : originalDoc?.tenants)
    const after = membership(operation === 'create' || 'tenants' in data ? data.tenants : originalDoc?.tenants)

    const changed = new Set<string>()
    for (const id of new Set([...before.keys(), ...after.keys()])) {
      if (before.get(id) !== after.get(id)) changed.add(id)
    }
    for (const id of changed) {
      if (!administered.includes(id)) {
        throw forbidden(
          'Solo podés asignar, quitar o cambiar el rol de Empresas donde sos Administrador.',
        )
      }
    }
    if (operation === 'create' && after.size === 0) {
      throw forbidden('Asigná el Usuario a al menos una Empresa.')
    }
  }

  return data
}

// An Administrador of one Empresa can't delete a Usuario who also works for another one.
export const guardUserDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const editor = req.user as User | null
  if (!editor || isSuperAdmin(editor)) return
  const target = await req.payload.findByID({ collection: 'users', id, depth: 0, overrideAccess: true, req })
  const administered = administeredIDs(editor)
  const foreign = [...membership(target.tenants).keys()].some((tenantID) => !administered.includes(tenantID))
  if (foreign) {
    throw forbidden('Este Usuario también pertenece a otra Empresa: quitalo de la tuya en lugar de borrarlo.')
  }
}
