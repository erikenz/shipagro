import Link from 'next/link'
import type { ServerProps } from 'payload'

import { listPendientes, type PendienteKind } from '@/pendientes'
import { formatDay } from '@/pendientes/time'

import { cardStyle, listStyle, mutedStyle, rowStyle, tagStyle } from './styles'

const KIND_LABELS: Record<PendienteKind, string> = {
  'alerta-alcanzado': 'Alerta alcanzado',
  vencida: 'Vencida',
  hoy: 'Vence hoy',
  'alerta-cerca': 'Alerta cerca',
  abierta: 'Abierta',
}

const URGENT: PendienteKind[] = ['alerta-alcanzado', 'vencida']

export default async function Pendientes({ payload, user }: ServerProps) {
  if (!user) return null
  const pendientes = await listPendientes(payload, user)
  const adminRoute = payload.config.routes.admin

  return (
    <section className="card" style={cardStyle} aria-labelledby="pendientes-title">
      <h3 id="pendientes-title">Mis pendientes</h3>
      {pendientes.length === 0 ? (
        <p style={mutedStyle}>No tenés nada pendiente. Las Alertas y Operaciones a tu cargo aparecen acá.</p>
      ) : (
        <ul style={listStyle}>
          {pendientes.map((item) => (
            <li key={`${item.collection}-${item.id}`} style={rowStyle}>
              <span style={tagStyle(URGENT.includes(item.kind))}>{KIND_LABELS[item.kind]}</span>
              <Link href={`${adminRoute}/collections/${item.collection}/${item.id}`}>
                <strong>{item.contact}</strong>
              </Link>
              <span>{item.detail}</span>
              <span style={mutedStyle}>
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
