import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ConfirmAction } from '@/components/panel/confirm-action'
import { OperationForm } from '@/components/panel/forms/operation-form'
import { PageHeader } from '@/components/panel/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { advanceStageAction, deleteOperationAction } from '@/panel/actions/operations'
import { grainLabel, idOf, nameOf, nextStage, stagesFor } from '@/panel/labels'
import { relationOptions } from '@/panel/options'
import { getPanelContext } from '@/panel/session'

export default async function OperacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getPanelContext()
  const operation = await ctx.payload
    .findByID({ collection: 'operations', id: Number(id), depth: 1, ...ctx.access })
    .catch(() => null)
  if (!operation) notFound()

  const { contacts, users } = await relationOptions(ctx)
  const stages = stagesFor(operation.aFijar)
  const currentIndex = stages.findIndex((s) => s.value === operation.stage)
  const next = nextStage(operation.stage, operation.aFijar)
  const triggerID = idOf(operation.priceTrigger)

  return (
    <>
      <PageHeader
        title={`${nameOf(operation.seller)}${operation.buyer ? ` → ${nameOf(operation.buyer)}` : ''}`}
        description={`${grainLabel(operation.grain)}${operation.tons ? ` · ${operation.tons} t` : ''}`}
        back={{ href: '/operaciones', label: 'Operaciones' }}
        actions={
          <>
            {next && (
              <ConfirmAction
                action={advanceStageAction.bind(null, operation.id)}
                label={`Pasar a ${next.label}`}
                title={`¿Pasar a ${next.label}?`}
                description="El Próximo vencimiento se recalcula según la nueva etapa."
                variant="default"
              />
            )}
            {ctx.canManageUsers && (
              <ConfirmAction
                action={deleteOperationAction.bind(null, operation.id)}
                label="Eliminar"
                title="¿Eliminar esta Operación?"
                description="No se puede deshacer."
                confirmLabel="Sí, eliminar"
                variant="destructive"
              />
            )}
          </>
        }
      />

      <ol aria-label="Etapas" className="flex flex-wrap gap-y-2 overflow-x-auto rounded-lg border p-2">
        {stages.map((s, i) => (
          <li
            key={s.value}
            aria-current={i === currentIndex ? 'step' : undefined}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs whitespace-nowrap text-muted-foreground',
              i < currentIndex && 'text-foreground',
              i === currentIndex && 'bg-primary font-medium text-primary-foreground',
            )}
          >
            <span className="font-mono tabular-nums opacity-70">{i + 1}</span>
            {s.label}
          </li>
        ))}
      </ol>

      {triggerID && (
        <p className="text-sm text-muted-foreground">
          Creada al confirmar un{' '}
          <Link href={`/gatillos/${triggerID}`} className="font-medium text-foreground hover:underline">
            Precio gatillo
          </Link>
          .
        </p>
      )}

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="text-base">Datos</CardTitle>
        </CardHeader>
        <CardContent>
          <OperationForm operation={operation} contacts={contacts} users={users} defaultResponsable={ctx.user.id} />
        </CardContent>
      </Card>
    </>
  )
}
