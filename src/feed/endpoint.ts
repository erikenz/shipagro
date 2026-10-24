import type { Endpoint, PayloadHandler } from 'payload'

import { isSuperAdmin } from '@/access'

import { runFeedOnce } from './index'

// `/api/feed/tick`: one feed pass. The super-admin triggers it from the dashboard; a scheduler
// (e.g. Vercel Cron) can call it with `Authorization: Bearer $CRON_SECRET`.
const handler: PayloadHandler = async (req) => {
  const secret = process.env.CRON_SECRET
  const bearer = req.headers.get('authorization')
  const fromScheduler = Boolean(secret) && bearer === `Bearer ${secret}`
  if (!fromScheduler && !isSuperAdmin(req.user)) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const result = await runFeedOnce(req.payload)
  return Response.json(result, { status: result.error ? 502 : 200 })
}

export const feedTickEndpoints: Endpoint[] = [
  { path: '/feed/tick', method: 'post', handler },
  { path: '/feed/tick', method: 'get', handler },
]
