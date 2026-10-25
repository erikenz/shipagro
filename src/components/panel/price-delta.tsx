import { cn } from '@/lib/utils'

const formatter = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: 'exceptZero',
})

export function PriceDelta({ change, className }: { change: number | null; className?: string }) {
  if (change === null) return null
  return (
    <span
      className={cn(
        'font-mono text-xs tabular-nums',
        change > 0 ? 'text-primary' : change < 0 ? 'text-destructive' : 'text-muted-foreground',
        className,
      )}
    >
      <span className="sr-only">Variación </span>
      {formatter.format(change)}
    </span>
  )
}
