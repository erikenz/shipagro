import type { Instrument, PriceTrigger, Quote } from '@/payload-types'

export type Evaluation = 'none' | 'cerca' | 'alcanzado'

/** A trade older than this can't move a Precio gatillo (RNF03: never act on a stale price). */
export const MAX_QUOTE_AGE_MS = 5 * 60 * 1000

/** Cerca fires within 1% of the Precio objetivo. */
export const CERCA_RATIO = 0.01

type TriggerInput = Pick<
  PriceTrigger,
  'status' | 'side' | 'targetPrice' | 'validUntil' | 'activatedAt' | 'cercaNotifiedAt'
>
type QuoteInput = Pick<Quote, 'price' | 'tradedAt'> & {
  instrument: Pick<Instrument, 'lowLimitPrice' | 'highLimitPrice'> | number
}

const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires'

/**
 * The Vigencia is a calendar day: the Precio gatillo stays valid until the end of that day in
 * Argentina (UTC-3, no daylight saving), not until the instant the date picker stored.
 */
export const validUntilEnd = (validUntil: string): Date => {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: ARGENTINA_TIME_ZONE }).format(
    new Date(validUntil),
  )
  return new Date(`${day}T23:59:59.999-03:00`)
}

export const isExpired = (trigger: Pick<PriceTrigger, 'validUntil'>, now: Date): boolean =>
  Boolean(trigger.validUntil) && now > validUntilEnd(trigger.validUntil as string)

/** ADR 0002: whether a Cotización moves a Precio gatillo is decided here, by plain rules. */
export function evaluate(trigger: TriggerInput, quote: QuoteInput, now: Date): Evaluation {
  if (trigger.status !== 'activo' || isExpired(trigger, now)) return 'none'

  const tradedAt = new Date(quote.tradedAt).getTime()
  if (Number.isNaN(tradedAt)) return 'none'
  if (!trigger.activatedAt || tradedAt <= new Date(trigger.activatedAt).getTime()) return 'none'
  if (tradedAt < now.getTime() - MAX_QUOTE_AGE_MS) return 'none'

  const { price } = quote
  if (!(price > 0)) return 'none'
  if (typeof quote.instrument === 'object') {
    const { lowLimitPrice, highLimitPrice } = quote.instrument
    if (typeof lowLimitPrice === 'number' && price < lowLimitPrice) return 'none'
    if (typeof highLimitPrice === 'number' && price > highLimitPrice) return 'none'
  }

  const target = trigger.targetPrice
  const cercaAvailable = !trigger.cercaNotifiedAt

  if (trigger.side === 'venta') {
    if (price >= target) return 'alcanzado'
    if (cercaAvailable && price >= target * (1 - CERCA_RATIO)) return 'cerca'
  } else {
    if (price <= target) return 'alcanzado'
    if (cercaAvailable && price <= target * (1 + CERCA_RATIO)) return 'cerca'
  }
  return 'none'
}
