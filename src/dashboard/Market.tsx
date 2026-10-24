import type { ServerProps } from 'payload'

import { GRAINS, QUOTE_SOURCES } from '@/domain'
import { formatDay, formatTime } from '@/pendientes/time'

import { formatPrice, labelOf } from './format'
import PriceChart from './PriceChart'

export default async function Market({ payload, user }: Pick<ServerProps, 'payload' | 'user'>) {
  if (!user) return null
  const latest = await payload.find({
    collection: 'quotes',
    sort: '-tradedAt',
    limit: 1,
    depth: 1,
    overrideAccess: false,
    user,
  })
  const quote = latest.docs[0]
  const instrument = quote && typeof quote.instrument === 'object' ? quote.instrument : null
  // Every Cotización of the Instrumento is an observation of the same market, whatever its source.
  const history = quote
    ? await payload.find({
        collection: 'quotes',
        where: { instrument: { equals: instrument?.id ?? quote.instrument } },
        sort: '-tradedAt',
        limit: 60,
        depth: 0,
        overrideAccess: false,
        user,
      })
    : null

  return (
    <section className="desk-panel desk-market" aria-labelledby="desk-market-title">
      <div className="desk-panel-heading">
        <div>
          <h2 id="desk-market-title">
            {instrument
              ? `${labelOf(GRAINS, instrument.grain)} · ${instrument.month || instrument.symbol}`
              : 'Mercado de referencia'}
          </h2>
          <span className="desk-ticker">
            {instrument?.symbol ?? 'A3 Mercados'} ·{' '}
            {quote ? labelOf(QUOTE_SOURCES, quote.source) : 'Sin Cotizaciones'}
          </span>
        </div>
        <span className="desk-chip">Última Cotización registrada</span>
      </div>
      <div className="desk-quote">
        <div>
          <span className="desk-eyebrow">Último operado</span>
          <div className="desk-price-row">
            <strong className="desk-price">{formatPrice(quote?.price)}</strong>
            <span className="desk-muted">{instrument?.currency ?? '—'}/t</span>
          </div>
        </div>
        <dl className="desk-quote-side">
          <div>
            <dt>Punta compradora</dt>
            <dd>{formatPrice(quote?.bid)}</dd>
          </div>
          <div>
            <dt>Punta vendedora</dt>
            <dd>{formatPrice(quote?.offer)}</dd>
          </div>
        </dl>
      </div>
      <PriceChart quotes={history ? [...history.docs].reverse() : []} />
      <div className="desk-panel-footer">
        <span className="desk-muted">Las Alertas se evalúan sobre el último operado.</span>
        {quote && (
          <time className="desk-mono" dateTime={quote.tradedAt}>
            {formatDay(quote.tradedAt)} · {formatTime(quote.tradedAt)}
          </time>
        )}
      </div>
    </section>
  )
}
