import Link from 'next/link'
import { notFound } from 'next/navigation'

import { DetailList } from '@/components/panel/detail-list'
import { ResolveAlertForm } from '@/components/panel/forms/resolve-alert-form'
import { PageHeader } from '@/components/panel/page-header'
import { AlertKind, Pill, TriggerStatus } from '@/components/panel/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice } from '@/dashboard/format'
import { idOf, nameOf, resolutionLabel, sideLabel } from '@/panel/labels'
import { getPanelContext } from '@/panel/session'
import type { PriceTrigger, Quote } from '@/payload-types'
import { formatDay, formatTime } from '@/pendientes/time'

export default async function AlertaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { payload, access } = await getPanelContext()
  const alert = await payload
    .findByID({ collection: 'alerts', id: Number(id), depth: 2, ...access })
    .catch(() => null)
  if (!alert) notFound()

  const trigger = alert.priceTrigger as PriceTrigger
  const quote = alert.quote as Quote
  const open = alert.kind === 'alcanzado' && !alert.resolution
  const operationID = idOf(alert.operation)

  return (
    <>
      <PageHeader
        title={`Alerta · ${nameOf(trigger?.contact)}`}
        description={`${nameOf(trigger?.instrument, 'symbol')} ${sideLabel(trigger?.side).toLowerCase()} a ${formatPrice(trigger?.targetPrice)}`}
        back={{ href: '/alertas', label: 'Alertas' }}
        actions={<AlertKind kind={alert.kind} />}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Detalle</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailList
              items={[
                { label: 'Contacto', value: nameOf(trigger?.contact) },
                { label: 'Instrumento', value: <span className="font-mono">{nameOf(trigger?.instrument, 'symbol')}</span> },
                { label: 'Precio objetivo', value: <span className="font-mono tabular-nums">{formatPrice(trigger?.targetPrice)}</span> },
                { label: 'Precio de la Cotización', value: <span className="font-mono tabular-nums">{formatPrice(quote?.price)}</span> },
                { label: 'Cotización', value: quote ? `${formatDay(quote.tradedAt)} ${formatTime(quote.tradedAt)}` : '—' },
                { label: 'Responsable', value: nameOf(trigger?.responsable) },
                {
                  label: 'Precio gatillo',
                  value: trigger ? (
                    <Link href={`/gatillos/${trigger.id}`} className="inline-flex items-center gap-2 hover:underline">
                      <TriggerStatus status={trigger.status} />
                    </Link>
                  ) : (
                    '—'
                  ),
                },
                { label: 'Condiciones de entrega', value: trigger?.deliveryConditions },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{open ? 'Resolver' : 'Resolución'}</CardTitle>
          </CardHeader>
          <CardContent>
            {open ? (
              <ResolveAlertForm alertID={alert.id} currentTarget={trigger?.targetPrice ?? 0} />
            ) : alert.resolution ? (
              <div className="flex flex-col gap-3 text-sm">
                <Pill tone="muted" className="w-fit">
                  {resolutionLabel(alert.resolution)}
                </Pill>
                <p className="text-muted-foreground">
                  Por {nameOf(alert.resolvedBy)}
                  {alert.resolvedAt ? ` el ${formatDay(alert.resolvedAt)} ${formatTime(alert.resolvedAt)}` : ''}
                </p>
                {alert.newTargetPrice != null && <p>Nuevo objetivo: {formatPrice(alert.newTargetPrice)}</p>}
                {operationID && (
                  <Link href={`/operaciones/${operationID}`} className="font-medium text-primary hover:underline">
                    Ver Operación creada
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Es un aviso de cercanía: no requiere resolución. Se resuelve cuando el precio alcance el objetivo.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
