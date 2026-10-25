import Link from 'next/link'
import type { Where } from 'payload'

import { EmptyState } from '@/components/panel/empty-state'
import { PageHeader } from '@/components/panel/page-header'
import { StageBadge } from '@/components/panel/status-badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatPrice } from '@/dashboard/format'
import { cn } from '@/lib/utils'
import { grainLabel, nameOf } from '@/panel/labels'
import { getPanelContext } from '@/panel/session'
import { argentinaDay, formatDay } from '@/pendientes/time'

const filters = [
  { value: 'abiertas', label: 'Abiertas' },
  { value: 'mias', label: 'Mías' },
  { value: 'cobradas', label: 'Cobradas' },
  { value: 'todas', label: 'Todas' },
]

export default async function OperacionesPage({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { ver = 'abiertas' } = await searchParams
  const { payload, tenantWhere, access, user } = await getPanelContext()
  const extra: Where[] =
    ver === 'abiertas'
      ? [{ stage: { not_equals: 'cobrada' } }]
      : ver === 'mias'
        ? [{ stage: { not_equals: 'cobrada' } }, { responsable: { equals: user.id } }]
        : ver === 'cobradas'
          ? [{ stage: { equals: 'cobrada' } }]
          : []
  const { docs } = await payload.find({
    collection: 'operations',
    where: { and: [tenantWhere, ...extra] },
    sort: ver === 'cobradas' || ver === 'todas' ? '-updatedAt' : 'dueDate',
    depth: 1,
    limit: 200,
    ...access,
  })
  const today = argentinaDay(new Date())

  return (
    <>
      <PageHeader
        title="Operaciones"
        description="Negocios concertados, de la confirmación al cobro."
        actions={
          <Button asChild>
            <Link href="/operaciones/nueva">Nueva Operación</Link>
          </Button>
        }
      />
      <nav aria-label="Filtro" className="flex flex-wrap gap-1">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={`/operaciones?ver=${f.value}`}
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
        <EmptyState title="No hay Operaciones para mostrar" />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partes</TableHead>
                <TableHead>Grano</TableHead>
                <TableHead className="text-right">Toneladas</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Vence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((op) => {
                const overdue = op.dueDate && op.stage !== 'cobrada' && argentinaDay(op.dueDate) < today
                return (
                  <TableRow key={op.id}>
                    <TableCell className="font-medium">
                      <Link href={`/operaciones/${op.id}`} className="hover:underline">
                        {nameOf(op.seller)}
                        {op.buyer ? ` → ${nameOf(op.buyer)}` : ''}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {grainLabel(op.grain)}
                      {op.aFijar ? <span className="ml-1 text-xs text-muted-foreground">(a fijar)</span> : null}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{op.tons ?? '—'}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {op.price != null ? `${op.currency ?? ''} ${formatPrice(op.price)}` : '—'}
                    </TableCell>
                    <TableCell>
                      <StageBadge stage={op.stage} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{nameOf(op.responsable)}</TableCell>
                    <TableCell className={cn('text-muted-foreground', overdue && 'font-medium text-destructive')}>
                      {op.dueDate ? formatDay(op.dueDate) : '—'}
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
