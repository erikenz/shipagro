import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { EmptyState } from '@/components/panel/empty-state'
import { PageHeader } from '@/components/panel/page-header'
import { PriceDelta } from '@/components/panel/price-delta'
import { Pill } from '@/components/panel/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { latestQuotes } from '@/panel/market'
import { getPanelContext } from '@/panel/session'
import { listPendientes, type PendienteKind } from '@/pendientes'
import { formatDay, formatTime } from '@/pendientes/time'

const kindCopy: Record<PendienteKind, { label: string; tone: 'warning' | 'danger' | 'primary' | 'neutral' | 'muted' }> = {
  'alerta-alcanzado': { label: 'Precio alcanzado', tone: 'warning' },
  vencida: { label: 'Vencida', tone: 'danger' },
  hoy: { label: 'Vence hoy', tone: 'primary' },
  'alerta-cerca': { label: 'Cerca del objetivo', tone: 'neutral' },
  abierta: { label: 'Abierta', tone: 'muted' },
}

export default async function MesaPage() {
  const ctx = await getPanelContext()
  const { payload, user, tenantWhere } = ctx
  const [pendientes, quotes] = await Promise.all([
    listPendientes(payload, user, new Date(), tenantWhere),
    latestQuotes(payload, user, 6),
  ])

  return (
    <>
      <PageHeader
        title={`Hola, ${user.name.split(' ')[0]}`}
        description="Lo que tenés para resolver hoy, en orden de urgencia."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/gatillos/nuevo">Nuevo Precio gatillo</Link>
            </Button>
            <Button asChild>
              <Link href="/operaciones/nueva">Nueva Operación</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Pendientes</CardTitle>
            <span className="text-sm text-muted-foreground tabular-nums">{pendientes.length}</span>
          </CardHeader>
          <CardContent className="px-0">
            {pendientes.length === 0 ? (
              <EmptyState title="Nada pendiente" description="Cuando un Precio gatillo se alcance o una Operación venza, aparece acá." />
            ) : (
              <ul className="divide-y">
                {pendientes.map((p) => {
                  const href = p.collection === 'alerts' ? `/alertas/${p.id}` : `/operaciones/${p.id}`
                  const copy = kindCopy[p.kind]
                  return (
                    <li key={`${p.collection}-${p.id}`}>
                      <Link href={href} className="group flex items-center gap-3 px-6 py-3 hover:bg-muted/50">
                        <Pill tone={copy.tone} className="w-36 justify-center">
                          {copy.label}
                        </Pill>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-medium">{p.contact}</span>
                          <span className="truncate text-xs text-muted-foreground">
                            {p.collection === 'alerts' ? 'Alerta' : 'Operación'} · {p.detail}
                            {p.dueDate ? ` · vence ${formatDay(p.dueDate)}` : ''}
                          </span>
                        </span>
                        <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Mercado</CardTitle>
            <Link href="/mercado" className="text-sm text-muted-foreground hover:text-foreground">
              Ver todo
            </Link>
          </CardHeader>
          <CardContent className="px-0">
            {quotes.length === 0 ? (
              <EmptyState title="Sin Cotizaciones" description="Aparecen cuando el feed registre los primeros precios." />
            ) : (
              <ul className="divide-y">
                {quotes.map((q) => (
                  <li key={q.instrumentID} className="flex items-center justify-between gap-3 px-6 py-3">
                    <span className="flex flex-col">
                      <span className="font-mono text-sm font-medium">{q.symbol}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(q.tradedAt)}</span>
                    </span>
                    <span className="flex flex-col items-end">
                      <span className="font-mono text-sm tabular-nums">{q.priceLabel}</span>
                      <PriceDelta change={q.change} className="text-xs" />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
