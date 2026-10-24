import type { ServerProps } from 'payload'

import { formatDay, formatTime } from '@/pendientes/time'

import { feedState } from './market'

const lastUpdate = (lastSuccessAt?: string | null) =>
  lastSuccessAt
    ? `Última actualización: ${formatDay(lastSuccessAt)} ${formatTime(lastSuccessAt)}`
    : 'Todavía no hubo actualizaciones.'

export default async function EstadoFeed({ payload, user }: Pick<ServerProps, 'payload' | 'user'>) {
  if (!user) return null
  const status = await payload.findGlobal({ slug: 'feed-status', overrideAccess: false, user })
  const state = feedState(status.lastSuccessAt, new Date())

  return (
    <div className="desk-status" role="status">
      <span className={`desk-live desk-live-${state.kind}`}>
        <i aria-hidden="true" />
        {state.kind === 'cerrado' ? 'Mercado cerrado' : state.kind === 'sin-actualizar' ? 'Precios sin actualizar' : 'Rueda abierta · Precios al día'}
      </span>
      <span>A3 Mercados · reMarkets (prueba)</span>
      <span className="desk-status-detail">{lastUpdate(status.lastSuccessAt)}</span>
      {status.lastError && <span className="desk-status-detail">Último error del feed: {status.lastError}</span>}
    </div>
  )
}
