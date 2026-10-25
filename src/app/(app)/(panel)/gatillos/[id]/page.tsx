import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ConfirmAction } from '@/components/panel/confirm-action'
import { TriggerForm } from '@/components/panel/forms/trigger-form'
import { PageHeader } from '@/components/panel/page-header'
import { AlertKind, TriggerStatus } from '@/components/panel/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice } from '@/dashboard/format'
import { setTriggerStatusAction } from '@/panel/actions/triggers'
import { nameOf } from '@/panel/labels'
import { relationOptions } from '@/panel/options'
import { getPanelContext } from '@/panel/session'
import type { Quote } from '@/payload-types'
import { formatDay, formatTime } from '@/pendientes/time'

export default async function GatilloPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getPanelContext()
  const { payload, access } = ctx
  const trigger = await payload
    .findByID({ collection: 'price-triggers', id: Number(id), depth: 1, ...access })
    .catch(() => null)
  if (!trigger) notFound()

  const [options, alerts] = await Promise.all([
    relationOptions(ctx),
    payload.find({
      collection: 'alerts',
      where: { priceTrigger: { equals: trigger.id } },
      sort: '-createdAt',
      depth: 1,
      limit: 20,
      ...access,
    }),
  ])

  const editable = trigger.status === 'activo'

  return (
    <>
      <PageHeader
        title={`${nameOf(trigger.contact)} · ${nameOf(trigger.instrument, 'symbol')}`}
        back={{ href: '/gatillos', label: 'Precios gatillo' }}
        actions={
          <>
            <TriggerStatus status={trigger.status} />
            {editable && (
              <ConfirmAction
                action={setTriggerStatusAction.bind(null, trigger.id, 'cancelado')}
                label="Cancelar"
                title="¿Cancelar este Precio gatillo?"
                description="El feed deja de vigilarlo. Podés cargar uno nuevo cuando quieras."
                confirmLabel="Sí, cancelar"
                variant="destructive"
              />
            )}
            {(trigger.status === 'cancelado' || trigger.status === 'vencido') && (
              <ConfirmAction
                action={setTriggerStatusAction.bind(null, trigger.id, 'activo')}
                label="Reactivar"
                title="¿Reactivar este Precio gatillo?"
                description="El feed vuelve a vigilarlo con el mismo objetivo."
              />
            )}
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{editable ? 'Editar' : 'Datos'}</CardTitle>
          </CardHeader>
          <CardContent>
            {editable ? (
              <TriggerForm trigger={trigger} {...options} defaultResponsable={ctx.user.id} />
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Solo se puede editar un Precio gatillo activo. Objetivo: {formatPrice(trigger.targetPrice)}.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alertas</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {alerts.docs.length === 0 ? (
              <p className="px-6 text-sm text-muted-foreground">Todavía no generó Alertas.</p>
            ) : (
              <ul className="divide-y">
                {alerts.docs.map((a) => (
                  <li key={a.id}>
                    <Link href={`/alertas/${a.id}`} className="flex items-center justify-between gap-3 px-6 py-3 hover:bg-muted/50">
                      <AlertKind kind={a.kind} />
                      <span className="font-mono text-sm tabular-nums">{formatPrice((a.quote as Quote)?.price)}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDay(a.createdAt)} {formatTime(a.createdAt)}
                      </span>
                    </Link>
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
