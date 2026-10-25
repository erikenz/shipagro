import { feedState } from '@/dashboard/market'
import { isLiveFeed } from '@/feed/a3Client'
import { cn } from '@/lib/utils'
import type { PanelContext } from '@/panel/session'
import { formatDay, formatTime } from '@/pendientes/time'

export async function FeedStatus({ ctx }: { ctx: PanelContext }) {
  const status = await ctx.payload.findGlobal({ slug: 'feed-status', ...ctx.access })
  const live = isLiveFeed()
  // The mock trades around the clock, so market hours only apply to the live feed.
  const state = feedState(status.lastSuccessAt, new Date(), { ignoreMarketHours: !live })
  const label =
    state.kind === 'cerrado'
      ? 'Mercado cerrado'
      : state.kind === 'sin-actualizar'
        ? 'Precios sin actualizar'
        : live
          ? 'Rueda abierta · Precios al día'
          : 'Simulación al día'

  return (
    <div className="flex flex-col items-start gap-1 text-xs text-muted-foreground md:items-end">
      <span className="flex items-center gap-2 rounded-full border px-2.5 py-1 font-medium text-foreground">
        <span
          aria-hidden="true"
          className={cn(
            'size-2 rounded-full',
            state.kind === 'al-dia' ? 'bg-primary' : state.kind === 'sin-actualizar' ? 'bg-warning' : 'bg-muted-foreground',
          )}
        />
        {label}
      </span>
      <span>{live ? 'A3 Mercados · reMarkets (prueba)' : 'Precios simulados · Sin conexión a A3'}</span>
      <span>
        {status.lastSuccessAt
          ? `Última actualización: ${formatDay(status.lastSuccessAt)} ${formatTime(status.lastSuccessAt)}`
          : 'Todavía no hubo actualizaciones.'}
      </span>
      {status.lastError && <span className="text-destructive">Último error del feed: {status.lastError}</span>}
    </div>
  )
}
