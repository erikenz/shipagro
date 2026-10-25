import Link from 'next/link'

import { EmptyState } from '@/components/panel/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice, labelOf } from '@/dashboard/format'
import { QUOTE_SOURCES } from '@/domain'
import { cn } from '@/lib/utils'
import type { Instrument } from '@/payload-types'
import { alertKindLabel } from '@/panel/labels'
import type { PanelContext } from '@/panel/session'
import { formatDay, formatTime } from '@/pendientes/time'

const LIMIT = 6

export async function OpenAlerts({ ctx }: { ctx: PanelContext }) {
  const alerts = await ctx.payload.find({
    collection: 'alerts',
    where: { and: [ctx.tenantWhere, { resolution: { exists: false } }] },
    sort: '-createdAt',
    depth: 2,
    limit: LIMIT,
    ...ctx.access,
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Alertas abiertas</CardTitle>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
            alerts.totalDocs ? 'bg-warning text-warning-foreground' : 'bg-muted text-muted-foreground',
          )}
        >
          {alerts.totalDocs}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {alerts.docs.length === 0 ? (
          <EmptyState
            title="Sin Alertas abiertas"
            description="Cuando el mercado se acerque a un Precio objetivo, vas a encontrar el Contacto y la Cotización acá."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {alerts.docs.map((alert) => {
              const trigger = typeof alert.priceTrigger === 'object' ? alert.priceTrigger : null
              const instrument = trigger && typeof trigger.instrument === 'object' ? (trigger.instrument as Instrument) : null
              const contact = trigger && typeof trigger.contact === 'object' ? trigger.contact.name : '—'
              const quote = typeof alert.quote === 'object' ? alert.quote : null
              const hit = alert.kind === 'alcanzado'
              return (
                <li key={alert.id}>
                  <Link
                    href={`/alertas/${alert.id}`}
                    className={cn(
                      'flex flex-col gap-1 rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/50',
                      hit && 'border-warning bg-warning-soft',
                    )}
                  >
                    <span className="flex items-center justify-between gap-2 text-sm">
                      <strong className="font-medium">
                        {instrument?.symbol ?? 'Precio objetivo'} ·{' '}
                        <span className="font-mono tabular-nums">
                          {formatPrice(quote?.price)} {instrument?.currency ?? '—'}/t
                        </span>
                      </strong>
                      <time dateTime={alert.createdAt} className="shrink-0 font-mono text-xs text-muted-foreground">
                        {formatDay(alert.createdAt)} {formatTime(alert.createdAt)}
                      </time>
                    </span>
                    <span className="text-sm font-medium">{contact}</span>
                    <span className="text-xs text-muted-foreground">
                      {alertKindLabel(alert.kind)} · Objetivo {formatPrice(trigger?.targetPrice)} ·{' '}
                      {quote ? labelOf(QUOTE_SOURCES, quote.source) : 'Sin Cotización disponible'}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
        {alerts.totalDocs > LIMIT && (
          <Link href="/alertas" className="text-sm text-muted-foreground hover:text-foreground">
            Ver las {alerts.totalDocs} Alertas sin resolver
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
