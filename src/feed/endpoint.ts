import type { Endpoint, PayloadHandler, PayloadRequest } from 'payload'

import { simulateQuotes } from './simulate'

// `/api/feed/tick`: one pass of the demo market, run by the dashboard's "Simular cotizaciones"
// button. It writes simulated Cotizaciones and never contacts A3, so the demo works offline and
// with any Usuario's login. A scheduler may call it with `Authorization: Bearer $CRON_SECRET`.
const handler: PayloadHandler = async (req) => {
  const secret = process.env.CRON_SECRET
  const bearer = req.headers.get('authorization')
  const fromScheduler = Boolean(secret) && bearer === `Bearer ${secret}`
  if (!fromScheduler && !req.user) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Counted for whoever pressed the button: simulated Cotizaciones reach every Empresa, but their
  // dashboard only shows the Alertas of their own.
  const alertsBefore = req.user ? await countAlerts(req) : 0
  const result = await simulateQuotes(req.payload)
  const alerts = req.user ? (await countAlerts(req)) - alertsBefore : 0

  return Response.json({ ...result, alerts }, { status: result.error ? 502 : 200 })
}

const countAlerts = async (req: PayloadRequest) =>
  (await req.payload.count({ collection: 'alerts', overrideAccess: false, user: req.user }))
    .totalDocs

export const feedTickEndpoints: Endpoint[] = [
  { path: '/feed/tick', method: 'post', handler },
  { path: '/feed/tick', method: 'get', handler },
]
