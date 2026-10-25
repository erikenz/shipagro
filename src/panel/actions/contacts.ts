'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import type { Contact } from '@/payload-types'

import { text, toFormState, type FormState } from '../forms'
import { getPanelContext } from '../session'

export async function saveContactAction(contactID: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { payload, tenant, access } = await getPanelContext()
  if (!tenant) return { error: 'Elegí una Empresa primero.' }
  let savedID = contactID
  try {
    const data = {
      name: text(form, 'name') as string,
      type: text(form, 'type') as Contact['type'],
      cuit: text(form, 'cuit'),
      phone: text(form, 'phone'),
      email: text(form, 'email'),
      locality: text(form, 'locality'),
    }
    if (contactID) {
      await payload.update({ collection: 'contacts', id: contactID, data, ...access })
    } else {
      const doc = await payload.create({ collection: 'contacts', data: { ...data, tenant: tenant.id }, ...access })
      savedID = doc.id
    }
  } catch (err) {
    return toFormState(err)
  }
  revalidatePath('/', 'layout')
  if (!contactID) redirect(`/contactos/${savedID}`)
  return { ok: true, message: 'Contacto guardado.' }
}

export async function deleteContactAction(contactID: number): Promise<FormState> {
  const { payload, access } = await getPanelContext()
  try {
    await payload.delete({ collection: 'contacts', id: contactID, ...access })
  } catch (err) {
    return toFormState(err)
  }
  revalidatePath('/', 'layout')
  redirect('/contactos')
}
