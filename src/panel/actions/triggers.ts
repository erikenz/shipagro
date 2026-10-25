'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import type { PriceTrigger } from '@/payload-types'

import { day, id, number, text, toFormState, type FormState } from '../forms'
import { getPanelContext } from '../session'

export async function saveTriggerAction(triggerID: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { payload, tenant, access } = await getPanelContext()
  if (!tenant) return { error: 'Elegí una Empresa primero.' }
  let savedID = triggerID
  try {
    const data = {
      contact: id(form, 'contact') as number,
      instrument: id(form, 'instrument') as number,
      side: text(form, 'side') as PriceTrigger['side'],
      targetPrice: number(form, 'targetPrice') as number,
      deliveryConditions: text(form, 'deliveryConditions'),
      responsable: id(form, 'responsable') as number,
      validUntil: day(form, 'validUntil'),
    }
    if (triggerID) {
      await payload.update({ collection: 'price-triggers', id: triggerID, data, ...access })
    } else {
      const doc = await payload.create({
        collection: 'price-triggers',
        data: { ...data, status: 'activo', tenant: tenant.id },
        ...access,
      })
      savedID = doc.id
    }
  } catch (err) {
    return toFormState(err)
  }
  revalidatePath('/', 'layout')
  if (!triggerID) redirect(`/gatillos/${savedID}`)
  return { ok: true, message: 'Precio gatillo guardado.' }
}

export async function setTriggerStatusAction(triggerID: number, status: 'activo' | 'cancelado') {
  const { payload, access } = await getPanelContext()
  await payload.update({ collection: 'price-triggers', id: triggerID, data: { status }, ...access })
  revalidatePath('/', 'layout')
}
