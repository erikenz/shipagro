import { formatPrice } from '@/dashboard/format'
import { formatDay, formatTime } from '@/pendientes/time'

type Point = { price: number; tradedAt: string }

const LEFT = 6
const RIGHT = 562
const TOP = 12
const BOTTOM = 150

export function PriceChart({ points }: { points: Point[] }) {
  if (points.length < 2) {
    return (
      <div className="flex h-44 items-center justify-center rounded-md border border-dashed px-4 text-center text-sm text-muted-foreground">
        La evolución aparece cuando hay al menos dos Cotizaciones registradas.
      </div>
    )
  }

  const prices = points.map((p) => p.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const padding = Math.max((max - min) * 0.2, 0.5)
  const low = min - padding
  const high = max + padding
  const start = new Date(points[0].tradedAt).getTime()
  const end = new Date(points[points.length - 1].tradedAt).getTime()
  const x = (i: number) => {
    const fraction =
      end === start ? i / (points.length - 1) : (new Date(points[i].tradedAt).getTime() - start) / (end - start)
    return LEFT + fraction * (RIGHT - LEFT)
  }
  const y = (price: number) => TOP + ((high - price) / (high - low)) * (BOTTOM - TOP)
  const line = points.map((p, i) => `${x(i)},${y(p.price)}`).join(' ')
  const last = points.length - 1

  return (
    <svg viewBox="0 0 640 180" className="h-auto w-full" role="img" aria-labelledby="price-chart-title">
      <title id="price-chart-title">
        {`Evolución del último operado: de ${formatPrice(points[0].price)} a ${formatPrice(points[last].price)}. Últimas ${points.length} Cotizaciones registradas.`}
      </title>
      {[0, 1, 2, 3].map((step) => {
        const price = low + ((high - low) * step) / 3
        return (
          <g key={step}>
            <line x1={LEFT} x2={RIGHT} y1={y(price)} y2={y(price)} className="stroke-border" strokeDasharray="3 4" />
            <text x="572" y={y(price) + 4} className="fill-muted-foreground font-mono text-[11px]">
              {formatPrice(price)}
            </text>
          </g>
        )
      })}
      <polygon points={`${LEFT},${BOTTOM} ${line} ${RIGHT},${BOTTOM}`} className="fill-primary/10" />
      <polyline points={line} fill="none" strokeWidth="2" strokeLinejoin="round" className="stroke-primary" />
      <circle cx={x(last)} cy={y(points[last].price)} r="4.5" className="fill-primary stroke-background" strokeWidth="2" />
      <text x={LEFT} y="175" className="fill-muted-foreground font-mono text-[11px]">
        {formatDay(points[0].tradedAt)} {formatTime(points[0].tradedAt)}
      </text>
      <text x={RIGHT} y="175" textAnchor="end" className="fill-muted-foreground font-mono text-[11px]">
        {formatDay(points[last].tradedAt)} {formatTime(points[last].tradedAt)}
      </text>
    </svg>
  )
}
