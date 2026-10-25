import { EmptyState } from '@/components/panel/empty-state'
import { PageHeader } from '@/components/panel/page-header'
import { PriceDelta } from '@/components/panel/price-delta'
import { Sparkline } from '@/components/panel/sparkline'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { latestQuotes, priceSeries } from '@/panel/market'
import { getPanelContext } from '@/panel/session'
import { formatDay, formatTime } from '@/pendientes/time'

export default async function MercadoPage() {
  const { payload, user } = await getPanelContext()
  const quotes = await latestQuotes(payload, user, 40)
  const series = await Promise.all(quotes.map((q) => priceSeries(payload, user, q.instrumentID, 60)))

  return (
    <>
      <PageHeader
        title="Mercado"
        description="Últimas Cotizaciones que trajo el feed desde reMarkets (entorno de prueba de A3 Mercados)."
      />
      {quotes.length === 0 ? (
        <EmptyState
          title="Todavía no hay Cotizaciones"
          description="Aparecen cuando el feed corre por primera vez. Revisá el estado del feed arriba a la derecha."
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instrumento</TableHead>
                <TableHead className="text-right">Último</TableHead>
                <TableHead className="text-right">Variación</TableHead>
                <TableHead>Tendencia</TableHead>
                <TableHead>Operado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((q, i) => (
                <TableRow key={q.instrumentID}>
                  <TableCell className="font-mono text-xs font-medium">{q.symbol}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{q.priceLabel}</TableCell>
                  <TableCell className="text-right">
                    <PriceDelta change={q.change} />
                  </TableCell>
                  <TableCell>
                    <Sparkline values={series[i].map((p) => p.price)} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDay(q.tradedAt)} {formatTime(q.tradedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
