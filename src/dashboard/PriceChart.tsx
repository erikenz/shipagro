import type { Quote } from '@/payload-types'
import { formatDay, formatTime } from '@/pendientes/time'

import { formatPrice } from './format'

export default function PriceChart({ quotes }: { quotes: Pick<Quote, 'price' | 'tradedAt'>[] }) {
  if (quotes.length < 2) {
    return (
      <div className="desk-chart-empty">
        La evolución aparece cuando hay al menos dos Cotizaciones registradas.
      </div>
    )
  }

  const prices = quotes.map((quote) => quote.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const padding = Math.max((max - min) * 0.2, 0.5)
  const low = min - padding
  const high = max + padding
  const start = new Date(quotes[0].tradedAt).getTime()
  const end = new Date(quotes[quotes.length - 1].tradedAt).getTime()
  const x = (index: number) => {
    const fraction =
      end === start
        ? index / (quotes.length - 1)
        : (new Date(quotes[index].tradedAt).getTime() - start) / (end - start)
    return 6 + fraction * 556
  }
  const y = (price: number) => 12 + ((high - price) / (high - low)) * 138
  const points = quotes.map((quote, index) => `${x(index)},${y(quote.price)}`).join(' ')
  const last = quotes.length - 1

  return (
    <svg className="desk-chart" viewBox="0 0 640 180" role="img" aria-labelledby="desk-chart-title">
      <title id="desk-chart-title">
        {`Evolución del último operado: de ${formatPrice(quotes[0].price)} a ${formatPrice(quotes[last].price)}. Últimas ${quotes.length} Cotizaciones registradas.`}
      </title>
      {[0, 1, 2, 3].map((step) => {
        const price = low + ((high - low) * step) / 3
        return (
          <g key={step}>
            <line className="desk-chart-grid" x1="6" x2="562" y1={y(price)} y2={y(price)} />
            <text x="572" y={y(price) + 4}>
              {formatPrice(price)}
            </text>
          </g>
        )
      })}
      <polygon className="desk-chart-area" points={`6,150 ${points} 562,150`} />
      <polyline className="desk-chart-line" points={points} />
      <circle className="desk-chart-dot" cx={x(last)} cy={y(quotes[last].price)} r="4.5" />
      <text x="6" y="175">
        {formatDay(quotes[0].tradedAt)} {formatTime(quotes[0].tradedAt)}
      </text>
      <text x="562" y="175" textAnchor="end">
        {formatDay(quotes[last].tradedAt)} {formatTime(quotes[last].tradedAt)}
      </text>
    </svg>
  )
}
