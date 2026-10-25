'use server'

import { revalidatePath } from 'next/cache'

import type { Alert } from '@/payload-types'

import { number, text, toFormState, type FormState } from '../forms'
import { getPanelContext } from '../session'

/** Resolving an Alerta runs the Alertas hook that confirms, re-targets or cancels its Precio gatillo. */
export async function resolveAlertAction(alertID: number, _prev: FormState, form: FormData): Promise<FormState> {
  const { payload, access } = await getPanelContext()
  const resolution = text(form, 'resolution') as Alert['resolution']
  if (!resolution) return { error: 'Elegí qué hacer con la Alerta.' }
  const newTargetPrice = number(form, 'newTargetPrice')
  if (resolution === 'actualizar' && newTargetPrice === null) {
    return { fieldErrors: { newTargetPrice: 'Ingresá el nuevo Precio objetivo.' } }
  }
  try {
    await payload.update({
      collection: 'alerts',
      id: alertID,
      data: { resolution, ...(resolution === 'actualizar' ? { newTargetPrice } : {}) },
      ...access,
    })
  } catch (err) {
    return toFormState(err)
  }
  revalidatePath('/', 'layout')
  return { ok: true, message: 'Alerta resuelta.' }
}
