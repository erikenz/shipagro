import { type CollectionBeforeChangeHook, ValidationError } from 'payload'

import type { Operation } from '@/payload-types'

import { argentinaDayPlus } from './time'

const PLAZO_DAYS = 2

const sameInstant = (a: unknown, b: unknown): boolean => {
  if (!a && !b) return true
  if (!a || !b) return false
  return new Date(a as string).getTime() === new Date(b as string).getTime()
}

const relationID = (value: unknown): unknown =>
  value && typeof value === 'object' && 'id' in value ? (value as { id: unknown }).id : value

/**
 * Etapa defaults: moving an Operación to another Etapa keeps its Responsable and, unless the
 * same save sets a Plazo, puts the Plazo two days ahead. Precio fijado needs "a fijar".
 */
export const applyStageDefaults: CollectionBeforeChangeHook<Operation> = ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  const stage = data.stage ?? originalDoc?.stage
  const aFijar = data.aFijar ?? originalDoc?.aFijar
  if (stage === 'precio-fijado' && !aFijar) {
    throw new ValidationError({
      collection: 'operations',
      errors: [{ path: 'stage', message: 'La Etapa "Precio fijado" solo corresponde a Operaciones a fijar.' }],
      req,
    }, req.t)
  }

  if (operation !== 'update' || !originalDoc || !data.stage || data.stage === originalDoc.stage) return data

  const dueDateTouched = 'dueDate' in data && !sameInstant(data.dueDate, originalDoc.dueDate)
  if (!dueDateTouched) data.dueDate = argentinaDayPlus(new Date(), PLAZO_DAYS)

  if (!data.responsable) data.responsable = relationID(originalDoc.responsable) as Operation['responsable']

  return data
}
