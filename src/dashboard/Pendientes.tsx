import Link from 'next/link'
import type { ServerProps, Where } from 'payload'

import { listPendientes, type PendienteKind } from '@/pendientes'
import { formatDay } from '@/pendientes/time'

const KIND_LABELS: Record<PendienteKind, string> = {
  'alerta-alcanzado': 'Alerta alcanzado',
  vencida: 'Vencida',
  hoy: 'Vence hoy',
  'alerta-cerca': 'Alerta cerca',
  abierta: 'Abierta',
}

const URGENT: PendienteKind[] = ['alerta-alcanzado', 'vencida']

export default async function Pendientes({
  payload,
  user,
  tenantWhere,
}: Pick<ServerProps, 'payload' | 'user'> & { tenantWhere: Where }) {
  if (!user) return null
  const pendientes = await listPendientes(payload, user, new Date(), tenantWhere)
  const adminRoute = payload.config.routes.admin

  return (
    <section className="desk-panel desk-pending" aria-labelledby="pendientes-title">
      <div className="desk-panel-heading">
        <h2 id="pendientes-title">Mis pendientes</h2>
        <span className="desk-muted">Primero, lo que necesita tu atención <span className="desk-count">{pendientes.length}</span></span>
      </div>
      {pendientes.length === 0 ? (
        <p className="desk-empty">No tenés nada pendiente. Las Alertas y Operaciones a tu cargo aparecen acá.</p>
      ) : (
        <ul className="desk-pending-list">
          {pendientes.map((item) => (
            <li key={`${item.collection}-${item.id}`}>
              <span className={`desk-chip${URGENT.includes(item.kind) ? ' desk-chip-amber' : ''}`}>{KIND_LABELS[item.kind]}</span>
              <Link href={`${adminRoute}/collections/${item.collection}/${item.id}`}>
                <strong>{item.contact}</strong>
              </Link>
              <span>{item.detail}</span>
              <span className="desk-muted desk-mono">
                {item.collection === 'operations'
                  ? item.dueDate
                    ? `Plazo ${formatDay(item.dueDate)}`
                    : 'Sin plazo'
                  : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
