import type { Payload } from 'payload'

import { CERCA_RATIO } from '@/alerts/evaluate'
import type { PriceTrigger } from '@/payload-types'

import { createFeedStatusReporter } from './feedStatus'

export type SimulateResult = { quotes: number; error?: string }

type ActiveTrigger = Pick<PriceTrigger, 'instrument' | 'side' | 'targetPrice'>

const round1 = (value: number) => Number(value.toFixed(1))

/**
 * The demo market walks each watched Instrumento one step toward its tightest Precio objetivo:
 * first to the `cerca` threshold (99% of the target for a venta, 101% for a compra), then to the
 * target itself. Two clicks on the dashboard button therefore raise an Alerta cerca and then an
 * Alerta alcanzado, without reading a price from anywhere.
 *
 * Returns null only when there is no active Precio gatillo left to move.
 */
export function nextDemoPrice(latest: number | null, triggers: ActiveTrigger[]): number | null {
  if (triggers.length === 0) return null

  // One Instrumento can carry Precios gatillo in several Empresas. Venta wins when both sides
  // appear: a producer's sale is the case the demo tells.
  const ventas = triggers.filter((trigger) => trigger.side === 'venta').map((t) => t.targetPrice)
  const compras = triggers.filter((trigger) => trigger.side === 'compra').map((t) => t.targetPrice)
  const side = ventas.length > 0 ? 'venta' : 'compra'
  const target = side === 'venta' ? Math.min(...ventas) : Math.max(...compras)

  // The price is already at or past the target, so there is nothing to approach. Repeat it with a
  // fresh trade time instead: the Precio gatillo that made it active was created after the last
  // trade, so the hook has not seen it yet and this tick is what fires it. Moving the price back
  // would only confuse the list.
  if (latest !== null && (side === 'venta' ? latest >= target : latest <= target)) return latest

  // Round inside the threshold, so the simulated price always lands on the firing side of it.
  const cerca =
    side === 'venta'
      ? Math.ceil(target * (1 - CERCA_RATIO) * 10) / 10
      : Math.floor(target * (1 + CERCA_RATIO) * 10) / 10
  if (latest === null) return round1(cerca)

  const reachedCerca = side === 'venta' ? latest >= cerca : latest <= cerca
  return reachedCerca ? target : round1(cerca)
}

/**
 * One pass of the demo market: writes the next simulated Cotización for every Instrumento with an
 * active Precio gatillo, which the Quotes hook turns into Alertas. Local and synchronous — no
 * market-data endpoint is contacted.
 */
export async function simulateQuotes(payload: Payload): Promise<SimulateResult> {
  const status = createFeedStatusReporter(payload)
  let quotes = 0

  try {
    const { docs: triggers } = await payload.find({
      collection: 'price-triggers',
      where: { status: { equals: 'activo' } },
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })

    const byInstrument = new Map<number, ActiveTrigger[]>()
    for (const trigger of triggers) {
      const instrumentID =
        typeof trigger.instrument === 'object' ? trigger.instrument.id : trigger.instrument
      if (!instrumentID) continue
      byInstrument.set(instrumentID, [...(byInstrument.get(instrumentID) ?? []), trigger])
    }

    for (const [instrumentID, instrumentTriggers] of byInstrument) {
      const { docs: latest } = await payload.find({
        collection: 'quotes',
        where: { instrument: { equals: instrumentID } },
        sort: '-createdAt',
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })

      const price = nextDemoPrice(latest[0]?.price ?? null, instrumentTriggers)
      if (price === null) continue

      await payload.create({
        collection: 'quotes',
        data: {
          instrument: instrumentID,
          price,
          size: 50,
          tradedAt: new Date().toISOString(),
          bid: round1(price - 0.5),
          offer: round1(price + 0.5),
          source: 'remarkets',
        },
        overrideAccess: true,
      })
      quotes += 1
    }

    status.success()
    return { quotes }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    payload.logger.error(`feed: ${message}`)
    status.failure(message)
    return { quotes, error: message }
  } finally {
    await status.flush(true)
  }
}
