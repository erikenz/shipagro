import type { CollectionBeforeChangeHook } from 'payload'

import type { PriceTrigger } from '@/payload-types'

/**
 * A Precio gatillo is watched from its activation: creation, a new Precio objetivo, or a
 * return to `activo` (e.g. Resolución actualizar with the same price). Only trades after that
 * count, and the cerca notice is available again once per activation.
 */
export const stampActivation: CollectionBeforeChangeHook<PriceTrigger> = ({
  data,
  operation,
  originalDoc,
}) => {
  const targetChanged =
    data.targetPrice !== undefined && data.targetPrice !== originalDoc?.targetPrice
  const reactivated = data.status === 'activo' && originalDoc?.status !== 'activo'

  if (operation === 'create' || (operation === 'update' && (targetChanged || reactivated))) {
    data.activatedAt = new Date().toISOString()
    data.cercaNotifiedAt = null
  }
  return data
}
