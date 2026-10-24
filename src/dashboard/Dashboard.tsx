import { getTenantFromCookie } from '@payloadcms/plugin-multi-tenant/utilities'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps, Where } from 'payload'

import { GRAINS, STAGES } from '@/domain'
import { isLiveFeed } from '@/feed/a3Client'
import { argentinaDay, argentinaDayPlus, formatDay } from '@/pendientes/time'

import AlertasAbiertas from './AlertasAbiertas'
import ContactBook from './ContactBook'
import EstadoFeed from './EstadoFeed'
import { labelOf } from './format'
import Market from './Market'
import Pendientes from './Pendientes'
import Refresh from './Refresh'
import './dashboard.scss'

export default async function Dashboard({ initPageResult }: AdminViewServerProps) {
  const { req } = initPageResult
  const { payload, user } = req
  if (!user) redirect(`${payload.config.routes.admin}${payload.config.admin.routes.login}`)

  // Local API reads enforce membership; also honor the Empresa selected in the admin.
  const tenantID = getTenantFromCookie(req.headers, payload.db.defaultIDType)
  const tenantWhere: Where = tenantID ? { tenant: { equals: tenantID } } : {}
  const props = { payload, user, tenantWhere }
  const adminRoute = payload.config.routes.admin
  const now = new Date()
  const due = await payload.find({
    collection: 'operations',
    where: {
      and: [
        tenantWhere,
        { stage: { not_equals: 'cobrada' } },
        { dueDate: { greater_than_equal: `${argentinaDay(now)}T00:00:00-03:00` } },
        { dueDate: { less_than: `${argentinaDay(argentinaDayPlus(now, 7))}T00:00:00-03:00` } },
      ],
    },
    sort: 'dueDate',
    limit: 6,
    depth: 1,
    overrideAccess: false,
    user,
    req,
  })

  return (
    <div className="trading-desk">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
      />
      <header className="desk-top">
        <div className="desk-brand">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <rect x="1" y="1" width="30" height="30" rx="8" fill="var(--desk-accent)" />
            <path d="m9 21.5 5-6 4 3 5.5-7.5" fill="none" stroke="var(--desk-accent-ink)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="23.5" cy="11" r="3" fill="var(--desk-amber)" stroke="var(--desk-accent-ink)" strokeWidth="1.6" />
          </svg>
          <h1>ShipAgro</h1>
          <span>Precios gatillo · Mesa comercial</span>
        </div>
        <EstadoFeed {...props} />
      </header>

      <section className="desk-due" aria-labelledby="desk-due-title">
        <h2 id="desk-due-title">Plazos en los próximos 7 días</h2>
        {due.docs.length ? (
          <ul>
            {due.docs.map((operation) => {
              const contact = operation.seller || operation.buyer
              return (
                <li key={operation.id}>
                  <Link href={`${adminRoute}/collections/operations/${operation.id}`}>
                    <time dateTime={operation.dueDate!}>{formatDay(operation.dueDate!)}</time>
                    <strong>{typeof contact === 'object' && contact ? contact.name : 'Operación'}</strong>
                    <span>{labelOf(GRAINS, operation.grain)} · {labelOf(STAGES, operation.stage)}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="desk-muted">No hay Operaciones con Plazo en los próximos 7 días.</p>
        )}
        {due.hasNextPage && <Link className="desk-text-link" href={`${adminRoute}/collections/operations`}>Ver todas las Operaciones</Link>}
      </section>

      <div className="desk-grid">
        <section className="desk-panel desk-new" aria-labelledby="desk-new-title">
          <div className="desk-panel-heading">
            <h2 id="desk-new-title">Nuevo precio gatillo</h2>
            <span className="desk-muted">Después de la llamada</span>
          </div>
          <p className="desk-intro">Lo que te pidió el Contacto, en un solo lugar.</p>
          <div className="desk-capture">
            <span className="desk-eyebrow">De la conversación al seguimiento</span>
            <p>Registrá el Instrumento, el Precio objetivo y las condiciones de entrega. Te avisamos cuando el mercado se acerque.</p>
            <Link className="desk-button desk-button-primary" href={`${adminRoute}/collections/price-triggers/create`}>
              <span aria-hidden="true">＋</span> Cargar precio gatillo
            </Link>
            <span className="desk-muted">Revisás los datos antes de guardar. No se envían órdenes.</span>
          </div>
          <div className="desk-panel-footer">
            <span className="desk-muted">Cada oportunidad, con su Responsable.</span>
            <Link className="desk-text-link" href={`${adminRoute}/collections/price-triggers`}>Ver precios gatillo →</Link>
          </div>
        </section>
        <Market {...props} />
        <AlertasAbiertas {...props} />
        <ContactBook {...props} now={now} />
        <Pendientes {...props} />
      </div>

      <footer className="desk-footer">
        <span>
          {isLiveFeed()
            ? 'A3 Mercados · reMarkets (prueba) y Cotizaciones manuales.'
            : 'Cotizaciones simuladas y manuales. No son datos de mercado reales.'}
          {' '}No se ejecutan órdenes.
        </span>
        <Refresh />
      </footer>
    </div>
  )
}
