import type { Payload, TypedUser, Where } from 'payload'

import { STAGES } from '@/domain'
import type { Contact, Instrument, PriceTrigger } from '@/payload-types'

import { type AlertRow, type OperationRow, type Pendiente, rankPendientes } from './rank'
import { daysAgo } from './time'

export type { Pendiente, PendienteKind } from './rank'

const contactName = (contact: number | Contact | null | undefined): string =>
  contact && typeof contact === 'object' ? contact.name : '—'

const stageLabel = (stage: string): string =>
  STAGES.find((option) => option.value === stage)?.label ?? stage

/** What `user` has to act on, in the Pendientes order (docs/architecture.md). */
export const listPendientes = async (
  payload: Payload,
  user: TypedUser,
  now: Date = new Date(),
  scope: Where = {},
): Promise<Pendiente[]> => {
  const [alerts, operations] = await Promise.all([
    payload.find({
      collection: 'alerts',
      where: {
        and: [
          scope,
          { 'priceTrigger.responsable': { equals: user.id } },
          {
            or: [
              { and: [{ kind: { equals: 'alcanzado' } }, { resolution: { exists: false } }] },
              {
                and: [
                  { kind: { equals: 'cerca' } },
                  { createdAt: { greater_than_equal: daysAgo(now, 7).toISOString() } },
                ],
              },
            ],
          },
        ],
      },
      depth: 2,
      pagination: false,
      overrideAccess: false,
      user,
    }),
    payload.find({
      collection: 'operations',
      where: {
        and: [scope, { responsable: { equals: user.id } }, { stage: { not_equals: 'cobrada' } }],
      },
      depth: 1,
      pagination: false,
      overrideAccess: false,
      user,
    }),
  ])

  const alertRows: AlertRow[] = alerts.docs.map((alert) => {
    const trigger =
      typeof alert.priceTrigger === 'object' ? (alert.priceTrigger as PriceTrigger) : null
    const instrument =
      trigger && typeof trigger.instrument === 'object' ? (trigger.instrument as Instrument) : null
    return {
      id: alert.id,
      kind: alert.kind,
      resolution: alert.resolution,
      createdAt: alert.createdAt,
      contact: contactName(trigger?.contact),
      instrument: instrument?.symbol ?? '—',
    }
  })

  const operationRows: OperationRow[] = operations.docs.map((operation) => {
    const seller = contactName(operation.seller)
    const buyer = operation.buyer ? contactName(operation.buyer) : null
    return {
      id: operation.id,
      stage: operation.stage,
      stageLabel: stageLabel(operation.stage),
      dueDate: operation.dueDate,
      contact: buyer ? `${seller} → ${buyer}` : seller,
    }
  })

  return rankPendientes({ alerts: alertRows, operations: operationRows, now })
}
