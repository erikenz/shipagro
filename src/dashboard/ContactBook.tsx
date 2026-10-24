import Link from 'next/link'
import type { ServerProps, Where } from 'payload'

import { TRIGGER_STATUSES } from '@/domain'
import { formatDay } from '@/pendientes/time'

import { formatPrice, labelOf } from './format'

export default async function ContactBook({
  payload,
  user,
  tenantWhere,
  now,
}: Pick<ServerProps, 'payload' | 'user'> & { tenantWhere: Where; now: Date }) {
  if (!user) return null
  const contacts = await payload.find({
    collection: 'contacts',
    where: tenantWhere,
    sort: 'name',
    limit: 5,
    depth: 0,
    overrideAccess: false,
    user,
  })
  const triggers = contacts.docs.length
    ? await payload.find({
        collection: 'price-triggers',
        where: {
          and: [
            tenantWhere,
            { contact: { in: contacts.docs.map((contact) => contact.id) } },
            { status: { in: ['activo', 'alcanzado'] } },
            {
              or: [
                { validUntil: { exists: false } },
                { validUntil: { greater_than_equal: now.toISOString() } },
              ],
            },
          ],
        },
        sort: '-createdAt',
        pagination: false,
        depth: 1,
        overrideAccess: false,
        user,
      })
    : null
  const adminRoute = payload.config.routes.admin

  return (
    <section className="desk-panel" aria-labelledby="desk-book-title">
      <div className="desk-panel-heading">
        <h2 id="desk-book-title">Cartera de Contactos</h2>
        <span className="desk-muted">{contacts.totalDocs} Contactos</span>
      </div>
      {contacts.docs.length ? (
        <div className="desk-table-wrap" role="region" aria-label="Cartera de Contactos" tabIndex={0}>
          <table className="desk-table">
            <thead>
              <tr>
                <th>Contacto</th>
                <th>Precio gatillo</th>
                <th>Vigencia</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {contacts.docs.map((contact) => {
                const active = triggers?.docs.filter((trigger) => {
                  const contactID = typeof trigger.contact === 'object'
                    ? trigger.contact.id
                    : trigger.contact
                  return contactID === contact.id
                }) ?? []
                const trigger = active[0]
                const instrument = trigger && typeof trigger.instrument === 'object'
                  ? trigger.instrument
                  : null
                return (
                  <tr key={contact.id}>
                    <td>
                      <Link className="desk-contact" href={`${adminRoute}/collections/contacts/${contact.id}`}>
                        {contact.name}
                      </Link>
                      <span className="desk-sub">{contact.locality || 'Sin localidad'}</span>
                    </td>
                    <td>
                      {trigger ? (
                        <Link href={`${adminRoute}/collections/price-triggers/${trigger.id}`}>
                          {instrument?.symbol ?? 'Ver precio gatillo'}
                          <span className="desk-sub desk-mono">
                            {formatPrice(trigger.targetPrice)} {instrument?.currency ?? '—'}/t
                            {' · '}{trigger.side === 'venta' ? 'Venta' : 'Compra'}
                          </span>
                          {active.length > 1 && (
                            <span className="desk-sub">+{active.length - 1} Precios gatillo</span>
                          )}
                        </Link>
                      ) : <span className="desk-muted">Sin precios gatillo activos</span>}
                    </td>
                    <td className="desk-mono">
                      {trigger?.validUntil ? formatDay(trigger.validUntil) : '—'}
                    </td>
                    <td>
                      <span className={`desk-chip${trigger?.status === 'alcanzado' ? ' desk-chip-amber' : ''}`}>
                        {trigger ? labelOf(TRIGGER_STATUSES, trigger.status) : 'Sin activo'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="desk-empty">
          Todavía no hay Contactos en esta Empresa. Cargá el primero para empezar el seguimiento.
        </p>
      )}
      <Link className="desk-text-link" href={`${adminRoute}/collections/contacts`}>
        {contacts.hasNextPage ? `Ver los ${contacts.totalDocs} Contactos` : 'Gestionar Contactos'} →
      </Link>
    </section>
  )
}
