import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { feedState } from '@/dashboard/market'
import { cn } from '@/lib/utils'
import { formatDay, formatTime } from '@/pendientes/time'

export function FeedBadge({ lastSuccessAt, live }: { lastSuccessAt?: string | null; live: boolean }) {
  // The mock trades around the clock, so market hours only apply to the live feed.
  const state = feedState(lastSuccessAt, new Date(), { ignoreMarketHours: !live })
  const label =
    state.kind === 'cerrado' ? 'Cerrado' : state.kind === 'sin-actualizar' ? 'Sin actualizar' : live ? 'En vivo' : 'Simulado'
  const detail = lastSuccessAt
    ? `Última actualización ${formatDay(lastSuccessAt)} ${formatTime(lastSuccessAt)}`
    : 'Todavía no hubo actualizaciones'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium">
          <span
            aria-hidden="true"
            className={cn(
              'size-1.5 rounded-full',
              state.kind === 'al-dia' ? 'bg-primary' : state.kind === 'sin-actualizar' ? 'bg-warning' : 'bg-muted-foreground',
            )}
          />
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{live ? 'A3 Mercados · reMarkets (prueba)' : 'Precios simulados · Sin conexión a A3'}</p>
        <p className="opacity-80">{detail}</p>
      </TooltipContent>
    </Tooltip>
  )
}
