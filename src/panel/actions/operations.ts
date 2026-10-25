'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import type { Operation } from '@/payload-types'

import { checkbox, day, id, number, text, toFormState, type FormState } from '../forms'
import { nextStage } from '../labels'
import { getPanelContext } from '../session'

const fromForm = (form: FormData) => ({
  seller: id(form, 'seller'),
  buyer: id(form, 'buyer'),
  grain: text(form, 'grain') as Operation['grain'],
  tons: number(form, 'tons'),
  price: number(form, 'price'),
  currency: (text(form, 'currency') as Operation['currency']) ?? 'USD',
  deliveryConditions: text(form, 'deliveryConditions'),
  aFijar: checkbox(form, 'aFijar'),
  stage: (text(form, 'stage') as Operation['stage']) ?? 'concertada',
  responsable: id(form, 'responsable') as number,
  dueDate: day(form, 'dueDate'),
})

export async function saveOperationAction(operationID: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { payload, tenant, access } = await getPanelContext()
  if (!tenant) return { error: 'Elegí una Empresa primero.' }
  let savedID = operationID
  try {
    const data = fromForm(form)
    if (operationID) {
      await payload.update({ collection: 'operations', id: operationID, data, ...access })
    } else {
      const doc = await payload.create({ collection: 'operations', data: { ...data, tenant: tenant.id }, ...access })
      savedID = doc.id
    }
  } catch (err) {
    return toFormState(err)
  }
  revalidatePath('/', 'layout')
  if (!operationID) redirect(`/operaciones/${savedID}`)
  return { ok: true, message: 'Operación guardada.' }
}

export async function advanceStageAction(operationID: number) {
  const { payload, access } = await getPanelContext()
  const operation = await payload.findByID({ collection: 'operations', id: operationID, depth: 0, ...access })
  const next = nextStage(operation.stage, operation.aFijar)
  if (!next) return
  await payload.update({
    collection: 'operations',
    id: operationID,
    data: { stage: next.value as Operation['stage'] },
    ...access,
  })
  revalidatePath('/', 'layout')
}

export async function deleteOperationAction(operationID: number) {
  const { payload, access } = await getPanelContext()
  await payload.delete({ collection: 'operations', id: operationID, ...access })
  revalidatePath('/', 'layout')
  redirect('/operaciones')
}
