import Link from 'next/link'
import type { ServerProps, Where } from 'payload'

import { ALERT_KINDS, QUOTE_SOURCES } from '@/domain'
import { formatDay, formatTime } from '@/pendientes/time'

import { formatPrice, labelOf } from './format'

const LIMIT = 10

export default async function AlertasAbiertas({
  payload,
  user,
  tenantWhere,
}: Pick<ServerProps, 'payload' | 'user'> & { tenantWhere: Where }) {
  if (!user) return null
  const alerts = await payload.find({
    collection: 'alerts',
    where: { and: [tenantWhere, { resolution: { exists: false } }] },
    sort: '-createdAt',
    depth: 2,
    limit: LIMIT,
    overrideAccess: false,
    user,
  })
  const adminRoute = payload.config.routes.admin

  return (
    <section className="desk-panel" aria-labelledby="alertas-abiertas-title">
      <div className="desk-panel-heading">
        <h2 id="alertas-abiertas-title">Alertas abiertas</h2>
        <span className={`desk-count${alerts.totalDocs ? ' desk-count-on' : ''}`}>
          {alerts.totalDocs}
        </span>
      </div>
      {alerts.docs.length === 0 ? (
        <p className="desk-empty">
          No hay Alertas sin resolver. Cuando el mercado se acerque a un Precio objetivo, vas a
          encontrar el Contacto y la Cotización acá.
        </p>
      ) : (
        <ul className="desk-alert-list">
          {alerts.docs.map((alert) => {
            const trigger = typeof alert.priceTrigger === 'object' ? alert.priceTrigger : null
            const instrument =
              trigger && typeof trigger.instrument === 'object' ? trigger.instrument : null
            const contact =
              trigger && typeof trigger.contact === 'object' ? trigger.contact.name : '—'
            const quote = typeof alert.quote === 'object' ? alert.quote : null
            return (
              <li
                key={alert.id}
                className={`desk-alert${alert.kind === 'alcanzado' ? ' desk-alert-hit' : ''}`}
              >
                <div className="desk-alert-top">
                  <strong>
                    {instrument?.symbol ?? 'Precio objetivo'} ·{' '}
                    <span className="desk-mono">
                      {formatPrice(quote?.price)} {instrument?.currency ?? '—'}/t
                    </span>
                  </strong>
                  <time dateTime={alert.createdAt}>
                    {formatDay(alert.createdAt)} · {formatTime(alert.createdAt)}
                  </time>
                </div>
                <strong className="desk-alert-contact">{contact}</strong>
                <span className="desk-alert-meta">
                  {labelOf(ALERT_KINDS, alert.kind)} · Objetivo {formatPrice(trigger?.targetPrice)}{' '}
                  · {quote ? labelOf(QUOTE_SOURCES, quote.source) : 'Sin Cotización disponible'}
                </span>
                <Link
                  className="desk-text-link"
                  href={`${adminRoute}/collections/alerts/${alert.id}`}
                >
                  {alert.kind === 'alcanzado' ? 'Revisar y resolver Alerta' : 'Ver Alerta'} →
                </Link>
              </li>
            )
          })}
        </ul>
      )}
      {alerts.totalDocs > LIMIT ? (
        <Link href={`${adminRoute}/collections/alerts`}>
          Ver las {alerts.totalDocs} Alertas sin resolver
        </Link>
      ) : null}
    </section>
  )
}
