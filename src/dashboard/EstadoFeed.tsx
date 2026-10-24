import type { ServerProps } from 'payload'

import { formatDay, formatTime } from '@/pendientes/time'

import { feedState } from './market'
import { cardStyle, mutedStyle, tagStyle } from './styles'

const lastUpdate = (lastSuccessAt?: string | null) =>
  lastSuccessAt
    ? `Última actualización: ${formatDay(lastSuccessAt)} ${formatTime(lastSuccessAt)}`
    : 'Todavía no hubo actualizaciones.'

export default async function EstadoFeed({ payload, user }: ServerProps) {
  if (!user) return null
  const status = await payload.findGlobal({ slug: 'feed-status', overrideAccess: false, user })
  const state = feedState(status.lastSuccessAt, new Date())

  return (
    <section className="card" style={cardStyle} aria-labelledby="estado-feed-title">
      <h3 id="estado-feed-title">Precios</h3>
      {state.kind === 'cerrado' ? (
        <p>
          <span style={tagStyle(false)}>Mercado cerrado</span>
        </p>
      ) : state.kind === 'sin-actualizar' ? (
        <p role="status">
          <span style={tagStyle(true)}>
            {state.lastSuccessAt
              ? `Precios sin actualizar desde ${formatTime(state.lastSuccessAt)}`
              : 'Precios sin actualizar'}
          </span>
        </p>
      ) : (
        <p>Precios al día ({formatTime(state.lastSuccessAt)}).</p>
      )}
      <p style={mutedStyle}>{lastUpdate(status.lastSuccessAt)}</p>
      {status.lastError ? <p style={mutedStyle}>Último error del feed: {status.lastError}</p> : null}
    </section>
  )
}
