'use server'

import { revalidatePath } from 'next/cache'

import { text, toFormState, type FormState } from '../forms'
import { getPanelContext } from '../session'

export async function saveTenantAction(tenantID: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { payload, access, superAdmin } = await getPanelContext()
  if (!superAdmin) return { error: 'Solo un Super-admin puede gestionar Empresas.' }
  const name = text(form, 'name')
  if (!name) return { fieldErrors: { name: 'Ingresá un nombre.' } }
  try {
    if (tenantID) await payload.update({ collection: 'tenants', id: tenantID, data: { name }, ...access })
    else await payload.create({ collection: 'tenants', data: { name }, ...access })
  } catch (err) {
    return toFormState(err)
  }
  revalidatePath('/', 'layout')
  return { ok: true, message: tenantID ? 'Empresa actualizada.' : 'Empresa creada.' }
}
