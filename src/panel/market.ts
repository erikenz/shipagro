import type { Payload } from 'payload'

import { formatPrice } from '@/dashboard/format'
import type { Instrument, User } from '@/payload-types'

export type LatestQuote = {
  instrumentID: number
  symbol: string
  price: number
  priceLabel: string
  change: number | null
  tradedAt: string
}

/** The last price per Instrumento and its change against the previous trade. */
export async function latestQuotes(payload: Payload, user: User, max: number): Promise<LatestQuote[]> {
  const { docs } = await payload.find({
    collection: 'quotes',
    sort: '-tradedAt',
    limit: max * 12,
    depth: 1,
    overrideAccess: false,
    user,
  })

  const byInstrument = new Map<number, { last: (typeof docs)[number]; previous?: (typeof docs)[number] }>()
  for (const quote of docs) {
    const instrument = quote.instrument as Instrument
    if (!instrument || typeof instrument !== 'object') continue
    const entry = byInstrument.get(instrument.id)
    if (!entry) byInstrument.set(instrument.id, { last: quote })
    else if (!entry.previous) entry.previous = quote
  }

  return [...byInstrument.values()].slice(0, max).map(({ last, previous }) => {
    const instrument = last.instrument as Instrument
    return {
      instrumentID: instrument.id,
      symbol: instrument.symbol,
      price: last.price,
      priceLabel: formatPrice(last.price),
      change: previous ? last.price - previous.price : null,
      tradedAt: last.tradedAt,
    }
  })
}

/** Prices for one Instrumento, oldest first, for a chart. */
export async function priceSeries(payload: Payload, user: User, instrumentID: number, limit = 120) {
  const { docs } = await payload.find({
    collection: 'quotes',
    where: { instrument: { equals: instrumentID } },
    sort: '-tradedAt',
    limit,
    depth: 0,
    overrideAccess: false,
    user,
  })
  return docs.reverse().map((q) => ({ price: q.price, tradedAt: q.tradedAt }))
}
