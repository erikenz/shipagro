'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import type { TenantRole } from '@/access'

import { text, toFormState, type FormState } from '../forms'
import { idOf } from '../labels'
import { getPanelContext } from '../session'

/**
 * Creates or edits a Usuario's membership in the selected Empresa. Rows for other Empresas are
 * kept as they are; `guardUserChange` still checks which rows the caller may touch.
 */
export async function saveUserAction(userID: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { payload, tenant, access, canManageUsers } = await getPanelContext()
  if (!tenant || !canManageUsers) return { error: 'No tenés permiso para gestionar Usuarios.' }
  const role = (text(form, 'role') ?? 'comercial') as TenantRole
  const name = text(form, 'name')
  const email = text(form, 'email')
  const password = text(form, 'password')
  let savedID = userID

  try {
    if (userID) {
      const existing = await payload.findByID({ collection: 'users', id: userID, depth: 0, ...access })
      const rows = (existing.tenants ?? []).map((row) =>
        idOf(row.tenant) === tenant.id ? { tenant: tenant.id, role } : { tenant: idOf(row.tenant) as number, role: row.role },
      )
      await payload.update({
        collection: 'users',
        id: userID,
        data: { name: name ?? existing.name, email: email ?? existing.email, tenants: rows, ...(password ? { password } : {}) },
        ...access,
      })
    } else {
      if (!password || password.length < 8) {
        return { fieldErrors: { password: 'Usá al menos 8 caracteres.' } }
      }
      const doc = await payload.create({
        collection: 'users',
        data: { name: name as string, email: email as string, password, tenants: [{ tenant: tenant.id, role }] },
        ...access,
      })
      savedID = doc.id
    }
  } catch (err) {
    return toFormState(err)
  }
  revalidatePath('/usuarios')
  if (!userID) redirect(`/usuarios/${savedID}`)
  return { ok: true, message: 'Usuario guardado.' }
}

/** Removes the Usuario from the selected Empresa only. */
export async function removeFromTenantAction(userID: number): Promise<FormState> {
  const { payload, tenant, access, user } = await getPanelContext()
  if (!tenant) return { error: 'Elegí una Empresa primero.' }
  if (userID === user.id) return { error: 'No podés quitarte a vos mismo.' }
  try {
    const existing = await payload.findByID({ collection: 'users', id: userID, depth: 0, ...access })
    const rows = (existing.tenants ?? [])
      .filter((row) => idOf(row.tenant) !== tenant.id)
      .map((row) => ({ tenant: idOf(row.tenant) as number, role: row.role }))
    await payload.update({ collection: 'users', id: userID, data: { tenants: rows }, ...access })
  } catch (err) {
    return toFormState(err)
  }
  revalidatePath('/usuarios')
  redirect('/usuarios')
}
