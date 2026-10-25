import Link from 'next/link'

import { Pill } from '@/components/panel/status-badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice, labelOf } from '@/dashboard/format'
import { QUOTE_SOURCES } from '@/domain'
import type { Instrument } from '@/payload-types'
import { grainLabel } from '@/panel/labels'
import type { PanelContext } from '@/panel/session'
import { formatDay, formatTime } from '@/pendientes/time'

import { PriceChart } from './price-chart'

export async function MarketCard({ ctx }: { ctx: PanelContext }) {
  const { payload, access } = ctx
  const latest = await payload.find({ collection: 'quotes', sort: '-tradedAt', limit: 1, depth: 1, ...access })
  const quote = latest.docs[0]
  const instrument = quote && typeof quote.instrument === 'object' ? (quote.instrument as Instrument) : null
  // Every Cotización of the Instrumento is an observation of the same market, whatever its source.
  const history = quote
    ? await payload.find({
        collection: 'quotes',
        where: { instrument: { equals: instrument?.id ?? quote.instrument } },
        sort: '-tradedAt',
        limit: 60,
        depth: 0,
        ...access,
      })
    : null
  const points = history ? [...history.docs].reverse().map((q) => ({ price: q.price, tradedAt: q.tradedAt })) : []

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">
            {instrument ? `${grainLabel(instrument.grain)} · ${instrument.month || instrument.symbol}` : 'Mercado de referencia'}
          </CardTitle>
          <CardDescription className="font-mono text-xs">
            {instrument?.symbol ?? 'A3 Mercados'} · {quote ? labelOf(QUOTE_SOURCES, quote.source) : 'Sin Cotizaciones'}
          </CardDescription>
        </div>
        <Pill tone="muted">Última Cotización registrada</Pill>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Último operado</span>
            <div className="flex items-baseline gap-2">
              <strong className="font-mono text-4xl font-semibold tabular-nums tracking-tight">
                {formatPrice(quote?.price)}
              </strong>
              <span className="text-sm text-muted-foreground">{instrument?.currency ?? '—'}/t</span>
            </div>
          </div>
          <dl className="flex gap-6">
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">Punta compradora</dt>
              <dd className="font-mono text-sm tabular-nums">{formatPrice(quote?.bid)}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">Punta vendedora</dt>
              <dd className="font-mono text-sm tabular-nums">{formatPrice(quote?.offer)}</dd>
            </div>
          </dl>
        </div>
        <PriceChart points={points} />
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Las Alertas se evalúan sobre el último operado.</span>
        <span className="flex items-center gap-3">
          {quote && (
            <time className="font-mono" dateTime={quote.tradedAt}>
              {formatDay(quote.tradedAt)} · {formatTime(quote.tradedAt)}
            </time>
          )}
          <Link href="/mercado" className="font-medium text-foreground hover:underline">
            Ver Mercado
          </Link>
        </span>
      </CardFooter>
    </Card>
  )
}
