import Link from 'next/link'

import { EmptyState } from '@/components/panel/empty-state'
import { PageHeader } from '@/components/panel/page-header'
import { AlertKind, Pill } from '@/components/panel/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatPrice } from '@/dashboard/format'
import { cn } from '@/lib/utils'
import { nameOf, resolutionLabel } from '@/panel/labels'
import { getPanelContext } from '@/panel/session'
import type { PriceTrigger, Quote } from '@/payload-types'
import { formatDay, formatTime } from '@/pendientes/time'

const filters = [
  { value: 'abiertas', label: 'Abiertas' },
  { value: 'todas', label: 'Todas' },
]

export default async function AlertasPage({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { ver = 'abiertas' } = await searchParams
  const { payload, tenantWhere, access } = await getPanelContext()
  const where =
    ver === 'todas'
      ? tenantWhere
      : { and: [tenantWhere, { kind: { equals: 'alcanzado' } }, { resolution: { exists: false } }] }
  const { docs } = await payload.find({ collection: 'alerts', where, sort: '-createdAt', depth: 2, limit: 100, ...access })

  return (
    <>
      <PageHeader title="Alertas" description="Avisos del feed cuando un Precio gatillo se acerca o alcanza su objetivo." />
      <nav aria-label="Filtro" className="flex gap-1">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={`/alertas?ver=${f.value}`}
            aria-current={ver === f.value ? 'page' : undefined}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground',
              ver === f.value && 'bg-muted font-medium text-foreground',
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>
      {docs.length === 0 ? (
        <EmptyState title={ver === 'todas' ? 'Todavía no hubo Alertas' : 'No hay Alertas abiertas'} />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Instrumento</TableHead>
                <TableHead className="text-right">Objetivo</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead>Cuándo</TableHead>
                <TableHead>Resolución</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((alert) => {
                const trigger = alert.priceTrigger as PriceTrigger
                return (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <AlertKind kind={alert.kind} />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/alertas/${alert.id}`} className="hover:underline">
                        {nameOf(trigger?.contact)}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{nameOf(trigger?.instrument, 'symbol')}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{formatPrice(trigger?.targetPrice)}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{formatPrice((alert.quote as Quote)?.price)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDay(alert.createdAt)} {formatTime(alert.createdAt)}
                    </TableCell>
                    <TableCell>
                      {alert.resolution ? (
                        <Pill tone="muted">{resolutionLabel(alert.resolution)}</Pill>
                      ) : alert.kind === 'alcanzado' ? (
                        <Link href={`/alertas/${alert.id}`} className="text-sm font-medium text-primary hover:underline">
                          Resolver
                        </Link>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
