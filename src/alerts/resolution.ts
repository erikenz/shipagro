import { APIError, type CollectionBeforeChangeHook } from 'payload'

import type { Alert, Operation } from '@/payload-types'

import { idOf } from './ids'

const LOCKED_FIELDS = ['kind', 'quote', 'priceTrigger'] as const

/**
 * Records the Resolución of an Alerta alcanzado, once, and applies it to its Precio gatillo:
 * confirmar opens an Operación in Etapa Concertada, actualizar watches a new Precio objetivo
 * from now, cancelar closes it. The effects share the Alerta update's transaction.
 */
export const applyResolution: CollectionBeforeChangeHook<Alert> = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation !== 'update' || !originalDoc) return data

  for (const field of LOCKED_FIELDS) {
    if (data[field] !== undefined && idOf(data[field]) !== idOf(originalDoc[field])) {
      throw new APIError('El tipo, la Cotización y el Precio gatillo de una Alerta no se pueden cambiar.', 400, null, true)
    }
  }

  if (originalDoc.resolution) {
    const resolutionChanged =
      data.resolution !== undefined && data.resolution !== originalDoc.resolution
    const newTargetChanged =
      data.newTargetPrice !== undefined && data.newTargetPrice !== originalDoc.newTargetPrice
    if (resolutionChanged || newTargetChanged) {
      throw new APIError('Esta Alerta ya tiene una Resolución.', 400, null, true)
    }
    return data
  }

  const { resolution } = data
  if (!resolution) return data

  if (originalDoc.kind !== 'alcanzado') {
    throw new APIError('Solo una Alerta alcanzado lleva Resolución.', 400, null, true)
  }

  const triggerID = idOf(originalDoc.priceTrigger)
  const quoteID = idOf(originalDoc.quote)
  if (triggerID === undefined || quoteID === undefined) {
    throw new APIError('La Alerta no tiene Precio gatillo o Cotización.', 400, null, true)
  }

  const { payload } = req
  const trigger = await payload.findByID({ collection: 'price-triggers', id: triggerID, depth: 1, req })
  if (trigger.status !== 'alcanzado') {
    throw new APIError('El Precio gatillo de esta Alerta ya no está alcanzado.', 400, null, true)
  }

  switch (resolution) {
    case 'confirmar': {
      const instrument =
        typeof trigger.instrument === 'object'
          ? trigger.instrument
          : await payload.findByID({ collection: 'instruments', id: trigger.instrument, depth: 0, req })
      if (!instrument.grain) {
        throw new APIError(`El Instrumento ${instrument.symbol} no tiene grano: no se puede abrir la Operación.`, 400, null, true)
      }
      const quote = await payload.findByID({ collection: 'quotes', id: quoteID, depth: 0, req })
      const contact = idOf(trigger.contact)
      const party: Pick<Operation, 'seller' | 'buyer'> =
        trigger.side === 'venta' ? { seller: contact } : { buyer: contact }

      const created = await payload.create({
        collection: 'operations',
        data: {
          tenant: idOf(trigger.tenant),
          ...party,
          grain: instrument.grain,
          currency: instrument.currency ?? 'USD',
          price: quote.price,
          deliveryConditions: trigger.deliveryConditions,
          stage: 'concertada',
          responsable: idOf(trigger.responsable),
          priceTrigger: trigger.id,
        } as Omit<Operation, 'id' | 'createdAt' | 'updatedAt'>,
        req,
      })
      await payload.update({ collection: 'price-triggers', id: trigger.id, data: { status: 'confirmado' }, req })
      data.operation = created.id
      break
    }
    case 'actualizar': {
      const newTargetPrice = data.newTargetPrice ?? originalDoc.newTargetPrice
      if (typeof newTargetPrice !== 'number' || !(newTargetPrice > 0)) {
        throw new APIError('Para actualizar, indicá el nuevo precio objetivo.', 400, null, true)
      }
      // stampActivation on the Precio gatillo resets activatedAt and cercaNotifiedAt.
      await payload.update({
        collection: 'price-triggers',
        id: trigger.id,
        data: { status: 'activo', targetPrice: newTargetPrice },
        req,
      })
      break
    }
    case 'cancelar':
      await payload.update({ collection: 'price-triggers', id: trigger.id, data: { status: 'cancelado' }, req })
      break
  }

  data.resolvedBy = req.user?.id ?? null
  data.resolvedAt = new Date().toISOString()
  return data
}
