import { ContactBook } from '@/components/panel/dashboard/contact-book'
import { DeskActions } from '@/components/panel/dashboard/desk-actions'
import { DueSoon } from '@/components/panel/dashboard/due-soon'
import { FeedStatus } from '@/components/panel/dashboard/feed-status'
import { MarketCard } from '@/components/panel/dashboard/market-card'
import { NewTriggerCard } from '@/components/panel/dashboard/new-trigger-card'
import { OpenAlerts } from '@/components/panel/dashboard/open-alerts'
import { PendientesCard } from '@/components/panel/dashboard/pendientes-card'
import { isLiveFeed } from '@/feed/a3Client'
import { getPanelContext } from '@/panel/session'

export default async function MesaPage() {
  const ctx = await getPanelContext()
  const now = new Date()
  const live = isLiveFeed()

  return (
    <>
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Mesa comercial</h1>
          <p className="text-sm text-muted-foreground">Precios gatillo, Alertas y Plazos de tu Empresa.</p>
        </div>
        <FeedStatus ctx={ctx} />
      </header>

      <DueSoon ctx={ctx} now={now} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <NewTriggerCard />
        <MarketCard ctx={ctx} />
        <OpenAlerts ctx={ctx} />
        <ContactBook ctx={ctx} now={now} />
        <PendientesCard ctx={ctx} now={now} />
      </div>

      <footer className="flex flex-col gap-3 border-t pt-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
        <span>
          {live
            ? 'A3 Mercados · reMarkets (prueba) y Cotizaciones manuales.'
            : 'Cotizaciones simuladas y manuales. No son datos de mercado reales.'}{' '}
          No se ejecutan órdenes.
        </span>
        <DeskActions canSimulate={!live && ctx.superAdmin} />
      </footer>
    </>
  )
}
