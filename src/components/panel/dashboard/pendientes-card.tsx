import Link from 'next/link'

import { EmptyState } from '@/components/panel/empty-state'
import { Pill } from '@/components/panel/status-badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { PanelContext } from '@/panel/session'
import { listPendientes, type PendienteKind } from '@/pendientes'
import { formatDay } from '@/pendientes/time'

const KINDS: Record<PendienteKind, { label: string; tone: 'warning' | 'danger' | 'primary' | 'neutral' | 'muted' }> = {
  'alerta-alcanzado': { label: 'Alerta alcanzado', tone: 'warning' },
  vencida: { label: 'Vencida', tone: 'danger' },
  hoy: { label: 'Vence hoy', tone: 'primary' },
  'alerta-cerca': { label: 'Alerta cerca', tone: 'neutral' },
  abierta: { label: 'Abierta', tone: 'muted' },
}

export async function PendientesCard({ ctx, now }: { ctx: PanelContext; now: Date }) {
  const pendientes = await listPendientes(ctx.payload, ctx.user, now, ctx.tenantWhere)

  return (
    <Card className="lg:col-span-3">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">Mis pendientes</CardTitle>
          <CardDescription>Primero, lo que necesita tu atención.</CardDescription>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
          {pendientes.length}
        </span>
      </CardHeader>
      <CardContent className="px-0">
        {pendientes.length === 0 ? (
          <EmptyState
            title="Nada pendiente"
            description="Las Alertas y Operaciones a tu cargo aparecen acá."
          />
        ) : (
          <ul className="divide-y">
            {pendientes.map((item) => {
              const kind = KINDS[item.kind]
              return (
                <li key={`${item.collection}-${item.id}`}>
                  <Link
                    href={item.collection === 'alerts' ? `/alertas/${item.id}` : `/operaciones/${item.id}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 px-6 py-3 transition-colors hover:bg-muted/50"
                  >
                    <Pill tone={kind.tone} className="w-32 justify-center">
                      {kind.label}
                    </Pill>
                    <strong className="text-sm font-medium">{item.contact}</strong>
                    <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{item.detail}</span>
                    {item.collection === 'operations' && (
                      <span className="font-mono text-xs text-muted-foreground">
                        {item.dueDate ? `Plazo ${formatDay(item.dueDate)}` : 'Sin plazo'}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
