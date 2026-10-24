import type { ServerProps } from 'payload'

import { isLiveFeed } from '@/feed/a3Client'
import { formatDay, formatTime } from '@/pendientes/time'

import { feedState } from './market'

const lastUpdate = (lastSuccessAt?: string | null) =>
  lastSuccessAt
    ? `Última actualización: ${formatDay(lastSuccessAt)} ${formatTime(lastSuccessAt)}`
    : 'Todavía no hubo actualizaciones.'

export default async function EstadoFeed({ payload, user }: Pick<ServerProps, 'payload' | 'user'>) {
  if (!user) return null
  const status = await payload.findGlobal({ slug: 'feed-status', overrideAccess: false, user })
  const live = isLiveFeed()
  // The mock trades around the clock, so market hours only apply to the live feed.
  const state = feedState(status.lastSuccessAt, new Date(), { ignoreMarketHours: !live })

  return (
    <div className="desk-status">
      <span className={`desk-live desk-live-${state.kind}`}>
        <i aria-hidden="true" />
        {state.kind === 'cerrado'
          ? 'Mercado cerrado'
          : state.kind === 'sin-actualizar'
            ? 'Precios sin actualizar'
            : live
              ? 'Rueda abierta · Precios al día'
              : 'Simulación al día'}
      </span>
      <span>
        {live ? 'A3 Mercados · reMarkets (prueba)' : 'Precios simulados · Sin conexión a A3'}
      </span>
      <span className="desk-status-detail">{lastUpdate(status.lastSuccessAt)}</span>
      {status.lastError && (
        <span className="desk-status-detail">Último error del feed: {status.lastError}</span>
      )}
    </div>
  )
}
