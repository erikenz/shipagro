import type { Payload } from 'payload'

import type { Instrument } from '@/payload-types'

import type { A3Client, A3Instrument } from './a3Client'

// Rosario futures: grain code, ".ROS/", month and two-digit year, nothing after
// (options such as "TRI.ROS/DIC23 352 C" carry a strike and side).
const ROSARIO_FUTURE = /^([A-Z]{3})\.ROS\/([A-Z]{3}\d{2})$/
const AGRO_SEGMENT = 'DDA'

const GRAIN_BY_CODE: Record<string, NonNullable<Instrument['grain']>> = {
  SOJ: 'soja',
  MAI: 'maiz',
  TRI: 'trigo',
  GIR: 'girasol',
  SOR: 'sorgo',
  CEB: 'cebada',
}

type InstrumentData = Pick<Instrument, 'symbol' | 'grain' | 'month' | 'currency' | 'lowLimitPrice' | 'highLimitPrice'>

export function toInstrumentData(a3: A3Instrument): InstrumentData | null {
  if (a3.segment !== AGRO_SEGMENT || a3.currency !== 'USD') return null
  const match = ROSARIO_FUTURE.exec(a3.symbol)
  if (!match) return null
  return {
    symbol: a3.symbol,
    grain: GRAIN_BY_CODE[match[1]] ?? null,
    month: match[2],
    currency: 'USD',
    lowLimitPrice: a3.lowLimitPrice,
    highLimitPrice: a3.highLimitPrice,
  }
}

/** Upserts the listed Rosario USD futures by symbol and marks the rest inactive. */
export async function refreshInstruments(payload: Payload, client: A3Client, signal?: AbortSignal) {
  const listed = (await client.listInstruments(signal)).flatMap((a3) => toInstrumentData(a3) ?? [])

  const existing = await payload.find({
    collection: 'instruments',
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  const bySymbol = new Map(existing.docs.map((doc) => [doc.symbol, doc]))
  const listedSymbols = new Set<string>()
  let created = 0
  let updated = 0

  for (const data of listed) {
    listedSymbols.add(data.symbol)
    const current = bySymbol.get(data.symbol)
    if (!current) {
      await payload.create({ collection: 'instruments', data: { ...data, active: true }, overrideAccess: true })
      created++
    } else if (hasChanges(current, data)) {
      await payload.update({
        collection: 'instruments',
        id: current.id,
        data: { ...data, active: true },
        overrideAccess: true,
      })
      updated++
    }
  }

  let deactivated = 0
  for (const doc of existing.docs) {
    if (doc.active && !listedSymbols.has(doc.symbol)) {
      await payload.update({ collection: 'instruments', id: doc.id, data: { active: false }, overrideAccess: true })
      deactivated++
    }
  }

  payload.logger.info(
    `feed: Instrumentos refreshed (${listed.length} listed, ${created} new, ${updated} updated, ${deactivated} inactive)`,
  )
}

function hasChanges(current: Instrument, data: InstrumentData): boolean {
  return (
    !current.active ||
    current.grain !== data.grain ||
    current.month !== data.month ||
    current.currency !== data.currency ||
    (current.lowLimitPrice ?? null) !== data.lowLimitPrice ||
    (current.highLimitPrice ?? null) !== data.highLimitPrice
  )
}
