import Link from 'next/link'

import { EmptyState } from '@/components/panel/empty-state'
import { PageHeader } from '@/components/panel/page-header'
import { TriggerStatus } from '@/components/panel/status-badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatPrice } from '@/dashboard/format'
import { TRIGGER_STATUSES } from '@/domain'
import { cn } from '@/lib/utils'
import { nameOf, sideLabel } from '@/panel/labels'
import { getPanelContext } from '@/panel/session'
import { formatDay } from '@/pendientes/time'

export default async function GatillosPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { estado = 'activo' } = await searchParams
  const { payload, tenantWhere, access } = await getPanelContext()
  const where = estado === 'todos' ? tenantWhere : { and: [tenantWhere, { status: { equals: estado } }] }
  const { docs } = await payload.find({ collection: 'price-triggers', where, sort: '-createdAt', depth: 1, limit: 200, ...access })
  const filters = [...TRIGGER_STATUSES, { value: 'todos', label: 'Todos' }]

  return (
    <>
      <PageHeader
        title="Precios gatillo"
        description="Precios objetivo de tus Contactos. El feed avisa cuando el mercado se acerca o los alcanza."
        actions={
          <Button asChild>
            <Link href="/gatillos/nuevo">Nuevo Precio gatillo</Link>
          </Button>
        }
      />
      <nav aria-label="Estado" className="flex flex-wrap gap-1">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={`/gatillos?estado=${f.value}`}
            aria-current={estado === f.value ? 'page' : undefined}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground',
              estado === f.value && 'bg-muted font-medium text-foreground',
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>
      {docs.length === 0 ? (
        <EmptyState
          title="No hay Precios gatillo en este estado"
          action={
            <Button asChild variant="outline">
              <Link href="/gatillos/nuevo">Cargar uno</Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contacto</TableHead>
                <TableHead>Instrumento</TableHead>
                <TableHead>Lado</TableHead>
                <TableHead className="text-right">Objetivo</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Válido hasta</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">
                    <Link href={`/gatillos/${t.id}`} className="hover:underline">
                      {nameOf(t.contact)}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{nameOf(t.instrument, 'symbol')}</TableCell>
                  <TableCell>{sideLabel(t.side)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{formatPrice(t.targetPrice)}</TableCell>
                  <TableCell className="text-muted-foreground">{nameOf(t.responsable)}</TableCell>
                  <TableCell className="text-muted-foreground">{t.validUntil ? formatDay(t.validUntil) : '—'}</TableCell>
                  <TableCell>
                    <TriggerStatus status={t.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
