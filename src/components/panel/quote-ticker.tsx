import { isLiveFeed } from '@/feed/a3Client'
import { latestQuotes } from '@/panel/market'
import { getPanelContext } from '@/panel/session'

import { PriceDelta } from './price-delta'
import { FeedBadge } from './feed-badge'

/** The header strip: the last price per active Instrumento and whether the feed is fresh. */
export async function QuoteTicker() {
  const { payload, access } = await getPanelContext()
  const [quotes, status] = await Promise.all([
    latestQuotes(payload, access.user, 8),
    payload.findGlobal({ slug: 'feed-status', ...access }),
  ])

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <FeedBadge lastSuccessAt={status.lastSuccessAt} live={isLiveFeed()} />
      <ul className="flex min-w-0 flex-1 items-center gap-5 overflow-x-auto text-sm [scrollbar-width:none]" aria-label="Últimos precios">
        {quotes.map((q) => (
          <li key={q.symbol} className="flex shrink-0 items-baseline gap-2">
            <span className="text-xs font-medium text-muted-foreground">{q.symbol}</span>
            <span className="font-mono font-medium tabular-nums">{q.priceLabel}</span>
            <PriceDelta change={q.change} />
          </li>
        ))}
        {quotes.length === 0 && <li className="text-xs text-muted-foreground">Sin cotizaciones todavía</li>}
      </ul>
    </div>
  )
}
