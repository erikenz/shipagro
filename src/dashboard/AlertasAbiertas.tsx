import Link from 'next/link'
import type { ServerProps } from 'payload'

import { ALERT_KINDS, QUOTE_SOURCES } from '@/domain'
import type { Instrument, PriceTrigger, Quote } from '@/payload-types'
import { formatDay, formatTime } from '@/pendientes/time'

import { cardStyle, listStyle, mutedStyle, rowStyle, tagStyle } from './styles'

const LIMIT = 10

const labelOf = (options: { label: string; value: string }[], value?: string | null) =>
  options.find((option) => option.value === value)?.label ?? value ?? '—'

export default async function AlertasAbiertas({ payload, user }: ServerProps) {
  if (!user) return null
  const alerts = await payload.find({
    collection: 'alerts',
    where: { resolution: { exists: false } },
    sort: '-createdAt',
    depth: 2,
    limit: LIMIT,
    overrideAccess: false,
    user,
  })
  const adminRoute = payload.config.routes.admin

  return (
    <section className="card" style={cardStyle} aria-labelledby="alertas-abiertas-title">
      <h3 id="alertas-abiertas-title">Alertas abiertas</h3>
      {alerts.docs.length === 0 ? (
        <p style={mutedStyle}>No hay Alertas sin resolver.</p>
      ) : (
        <ul style={listStyle}>
          {alerts.docs.map((alert) => {
            const trigger = typeof alert.priceTrigger === 'object' ? (alert.priceTrigger as PriceTrigger) : null
            const instrument =
              trigger && typeof trigger.instrument === 'object' ? (trigger.instrument as Instrument) : null
            const contact = trigger && typeof trigger.contact === 'object' ? trigger.contact.name : '—'
            const quote = typeof alert.quote === 'object' ? (alert.quote as Quote) : null
            return (
              <li key={alert.id} style={rowStyle}>
                <span style={tagStyle(alert.kind === 'alcanzado')}>{labelOf(ALERT_KINDS, alert.kind)}</span>
                <Link href={`${adminRoute}/collections/alerts/${alert.id}`}>
                  <strong>{contact}</strong> · {instrument?.symbol ?? '—'}
                  {quote ? ` a ${quote.price}` : null}
                </Link>
                <span style={mutedStyle}>{quote ? labelOf(QUOTE_SOURCES, quote.source) : '—'}</span>
                <span style={mutedStyle}>
                  {formatDay(alert.createdAt)} {formatTime(alert.createdAt)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
      {alerts.totalDocs > LIMIT ? (
        <Link href={`${adminRoute}/collections/alerts`}>Ver las {alerts.totalDocs} Alertas sin resolver</Link>
      ) : null}
    </section>
  )
}
