import Link from 'next/link'

import { grainLabel, stageLabel } from '@/panel/labels'
import type { PanelContext } from '@/panel/session'
import { argentinaDay, argentinaDayPlus, formatDay } from '@/pendientes/time'

export async function DueSoon({ ctx, now }: { ctx: PanelContext; now: Date }) {
  const due = await ctx.payload.find({
    collection: 'operations',
    where: {
      and: [
        ctx.tenantWhere,
        { stage: { not_equals: 'cobrada' } },
        { dueDate: { greater_than_equal: `${argentinaDay(now)}T00:00:00-03:00` } },
        { dueDate: { less_than: `${argentinaDay(argentinaDayPlus(now, 7))}T00:00:00-03:00` } },
      ],
    },
    sort: 'dueDate',
    limit: 6,
    depth: 1,
    ...ctx.access,
  })

  return (
    <section aria-labelledby="due-soon-title" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id="due-soon-title" className="text-sm font-medium">
          Plazos en los próximos 7 días
        </h2>
        {due.hasNextPage && (
          <Link href="/operaciones" className="text-sm text-muted-foreground hover:text-foreground">
            Ver todas las Operaciones
          </Link>
        )}
      </div>
      {due.docs.length ? (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {due.docs.map((operation) => {
            const contact = operation.seller || operation.buyer
            return (
              <li key={operation.id}>
                <Link
                  href={`/operaciones/${operation.id}`}
                  className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <time
                    dateTime={operation.dueDate!}
                    className="shrink-0 rounded-md bg-accent px-2 py-1 font-mono text-xs font-medium text-accent-foreground"
                  >
                    {formatDay(operation.dueDate!)}
                  </time>
                  <span className="flex min-w-0 flex-col">
                    <strong className="truncate text-sm font-medium">
                      {typeof contact === 'object' && contact ? contact.name : 'Operación'}
                    </strong>
                    <span className="truncate text-xs text-muted-foreground">
                      {grainLabel(operation.grain)} · {stageLabel(operation.stage)}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
          No hay Operaciones con Plazo en los próximos 7 días.
        </p>
      )}
    </section>
  )
}
