import type { Payload } from 'payload'

import type { Instrument } from '@/payload-types'

import { a3ClientFromEnv, type A3Client } from './a3Client'
import { createFeedStatusReporter } from './feedStatus'
import { refreshInstruments } from './refreshInstruments'

// shortcut: REST snapshots, one request per second, rotating over the watched
// Instrumentos (A3 recommends at most 1 req/s on /rest/marketdata/get). With N
// Instrumentos each refreshes every N s, fine for the demo's ~4. Past about 10,
// upgrade to the WebSocket (`smd` subscription) for real-time `Md` messages.
const TICK_MS = 1_000
const MAX_BACKOFF_MS = 30_000
const ROTATION_REFRESH_MS = 60_000
const INSTRUMENT_REFRESH_MS = 24 * 60 * 60 * 1000

type WatchedInstrument = Pick<Instrument, 'id' | 'symbol'>

type RunFeedOptions = { signal: AbortSignal; client?: A3Client }

/** Runs until `signal` aborts, writing a Cotización whenever a watched Instrumento's last trade changes. */
export async function runFeed(payload: Payload, { signal, client = a3ClientFromEnv() }: RunFeedOptions) {
  const status = createFeedStatusReporter(payload)
  let rotation: WatchedInstrument[] = []
  let cursor = 0
  let nextInstrumentRefreshAt = 0
  let nextRotationRefreshAt = 0
  let consecutiveErrors = 0

  payload.logger.info('feed: started')

  while (!signal.aborted) {
    try {
      if (Date.now() >= nextInstrumentRefreshAt) {
        await refreshInstruments(payload, client, signal)
        nextInstrumentRefreshAt = Date.now() + INSTRUMENT_REFRESH_MS
        nextRotationRefreshAt = 0
        status.success()
      } else {
        if (Date.now() >= nextRotationRefreshAt) {
          rotation = await loadRotation(payload)
          nextRotationRefreshAt = Date.now() + ROTATION_REFRESH_MS
        }
        if (rotation.length > 0) {
          cursor %= rotation.length
          const instrument = rotation[cursor]
          cursor++
          await pollInstrument(payload, client, instrument, signal)
          status.success()
        }
      }
      consecutiveErrors = 0
    } catch (err) {
      if (signal.aborted) break
      consecutiveErrors++
      const message = err instanceof Error ? err.message : String(err)
      payload.logger.error(`feed: ${message}`)
      status.failure(message)
    }

    await status.flush()
    await sleep(backoff(consecutiveErrors), signal)
  }

  await status.flush(true)
  payload.logger.info('feed: stopped')
}

export type FeedTickResult = { instruments: number; polled: number; error?: string }

/**
 * One pass of the feed, for serverless hosts with no long-lived process: refreshes Instrumentos,
 * polls every watched one once and records the outcome in `feed-status`.
 */
export async function runFeedOnce(
  payload: Payload,
  { client = a3ClientFromEnv(), signal }: { client?: A3Client; signal?: AbortSignal } = {},
): Promise<FeedTickResult> {
  const status = createFeedStatusReporter(payload)
  let rotation: WatchedInstrument[] = []
  try {
    await refreshInstruments(payload, client, signal)
    rotation = await loadRotation(payload)
    const abort = signal ?? new AbortController().signal
    for (const instrument of rotation) await pollInstrument(payload, client, instrument, abort)
    status.success()
    return { instruments: rotation.length, polled: rotation.length }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    payload.logger.error(`feed: ${message}`)
    status.failure(message)
    return { instruments: rotation.length, polled: 0, error: message }
  } finally {
    await status.flush(true)
  }
}

function backoff(consecutiveErrors: number): number {
  if (consecutiveErrors === 0) return TICK_MS
  return Math.min(MAX_BACKOFF_MS, TICK_MS * 2 ** (consecutiveErrors - 1))
}

/** Active Instrumentos with at least one Precio gatillo in status `activo`, across Empresas. */
async function loadRotation(payload: Payload): Promise<WatchedInstrument[]> {
  const triggers = await payload.find({
    collection: 'price-triggers',
    where: { status: { equals: 'activo' } },
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  const ids = [
    ...new Set(
      triggers.docs.map((trigger) =>
        typeof trigger.instrument === 'object' ? trigger.instrument.id : trigger.instrument,
      ),
    ),
  ]
  if (ids.length === 0) return []

  const instruments = await payload.find({
    collection: 'instruments',
    where: { and: [{ id: { in: ids } }, { active: { equals: true } }] },
    sort: 'symbol',
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  return instruments.docs.map(({ id, symbol }) => ({ id, symbol }))
}

async function pollInstrument(
  payload: Payload,
  client: A3Client,
  instrument: WatchedInstrument,
  signal: AbortSignal,
) {
  const snapshot = await client.getSnapshot(instrument.symbol, signal)
  if (!snapshot.last) return

  // Latest by creation, not tradedAt: a manual Cotización is stamped "now", so
  // sorting by tradedAt would keep it on top and make the feed rewrite LA every turn.
  const latest = await payload.find({
    collection: 'quotes',
    where: { instrument: { equals: instrument.id } },
    sort: '-createdAt',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const previous = latest.docs[0]
  const { price, size, tradedAt } = snapshot.last
  if (previous && previous.price === price && new Date(previous.tradedAt).getTime() === tradedAt.getTime()) {
    return
  }

  await payload.create({
    collection: 'quotes',
    data: {
      instrument: instrument.id,
      price,
      size,
      tradedAt: tradedAt.toISOString(),
      bid: snapshot.bid,
      offer: snapshot.offer,
      source: 'remarkets',
    },
    overrideAccess: true,
  })
  payload.logger.info(`feed: Cotización ${instrument.symbol} ${price} at ${tradedAt.toISOString()}`)
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve()
    const timer = setTimeout(done, ms)
    signal.addEventListener('abort', done, { once: true })
    function done() {
      clearTimeout(timer)
      signal.removeEventListener('abort', done)
      resolve()
    }
  })
}
