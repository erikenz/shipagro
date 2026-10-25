import type { Endpoint, PayloadHandler, PayloadRequest } from 'payload'

import { isSuperAdmin } from '@/access'
import { isMarketOpen } from '@/dashboard/market'

import { isLiveFeed } from './a3Client'
import { pollOnce, refreshInstrumentsOnce } from './index'
import { simulateQuotes } from './simulate'

// Cotizaciones are shared by every Empresa, so only a scheduler (Authorization: Bearer
// $CRON_SECRET) or the super-admin may write them through these endpoints.
const isAuthorized = (req: PayloadRequest) => {
  const secret = process.env.CRON_SECRET
  const fromScheduler = Boolean(secret) && req.headers.get('authorization') === `Bearer ${secret}`
  return fromScheduler || isSuperAdmin(req.user)
}

const unauthorized = () => Response.json({ error: 'No autorizado' }, { status: 401 })

// `/api/feed/tick`: one pass of the feed. With `A3_MODE=live` it reads reMarkets for every
// Instrumento with an active Precio gatillo (skipped outside market hours so the scheduler never
// wakes the database for nothing); otherwise it runs one step of the simulated market.
const tick: PayloadHandler = async (req) => {
  if (!isAuthorized(req)) return unauthorized()

  if (isLiveFeed()) {
    const force = new URL(req.url ?? '', 'http://local').searchParams.get('force') === '1'
    if (!force && !isMarketOpen(new Date())) {
      return Response.json({ skipped: 'mercado cerrado', polled: 0 })
    }
    const result = await pollOnce(req.payload)
    return Response.json(result, { status: result.error ? 502 : 200 })
  }

  const result = await simulateQuotes(req.payload)
  return Response.json(result, { status: result.error ? 502 : 200 })
}

// `/api/feed/instruments`: refresh the listed Rosario USD futures from reMarkets. Run once a day
// (Vercel Hobby's daily cron is enough).
const instruments: PayloadHandler = async (req) => {
  if (!isAuthorized(req)) return unauthorized()
  if (!isLiveFeed()) return Response.json({ skipped: 'A3_MODE no es live' })
  try {
    await refreshInstrumentsOnce(req.payload)
    return Response.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    req.payload.logger.error(`feed: ${message}`)
    return Response.json({ error: message }, { status: 502 })
  }
}

export const feedTickEndpoints: Endpoint[] = [
  { path: '/feed/tick', method: 'post', handler: tick },
  { path: '/feed/tick', method: 'get', handler: tick },
  { path: '/feed/instruments', method: 'post', handler: instruments },
  { path: '/feed/instruments', method: 'get', handler: instruments },
]
