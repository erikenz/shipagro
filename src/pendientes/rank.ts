import { argentinaDay, daysAgo } from './time'

// The Pendientes order from docs/architecture.md, as a pure function over plain rows.

export type PendienteKind = 'alerta-alcanzado' | 'vencida' | 'hoy' | 'alerta-cerca' | 'abierta'

export type AlertRow = {
  id: number
  kind: 'cerca' | 'alcanzado'
  resolution?: string | null
  createdAt: string
  contact: string
  instrument: string
}

export type OperationRow = {
  id: number
  stage: string
  stageLabel: string
  dueDate?: string | null
  contact: string
}

export type Pendiente = {
  kind: PendienteKind
  collection: 'alerts' | 'operations'
  id: number
  contact: string
  /** The Instrumento for an Alerta, the Etapa for an Operación. */
  detail: string
  dueDate?: string | null
}

const CERCA_WINDOW_DAYS = 7

const byTime = (a?: string | null, b?: string | null): number => {
  if (!a && !b) return 0
  if (!a) return 1
  if (!b) return -1
  return new Date(a).getTime() - new Date(b).getTime()
}

/** Ranks what a Usuario has to act on. Callers pass only rows the Usuario is Responsable for. */
export const rankPendientes = ({
  alerts,
  operations,
  now,
}: {
  alerts: AlertRow[]
  operations: OperationRow[]
  now: Date
}): Pendiente[] => {
  const today = argentinaDay(now)
  const cercaSince = daysAgo(now, CERCA_WINDOW_DAYS).getTime()

  const fromAlert = (kind: PendienteKind) => (alert: AlertRow): Pendiente => ({
    kind,
    collection: 'alerts',
    id: alert.id,
    contact: alert.contact,
    detail: alert.instrument,
  })
  const fromOperation = (kind: PendienteKind) => (operation: OperationRow): Pendiente => ({
    kind,
    collection: 'operations',
    id: operation.id,
    contact: operation.contact,
    detail: operation.stageLabel,
    dueDate: operation.dueDate,
  })

  const alcanzado = alerts
    .filter((alert) => alert.kind === 'alcanzado' && !alert.resolution)
    .sort((a, b) => byTime(a.createdAt, b.createdAt))
    .map(fromAlert('alerta-alcanzado'))

  const cerca = alerts
    .filter((alert) => alert.kind === 'cerca' && new Date(alert.createdAt).getTime() >= cercaSince)
    .sort((a, b) => byTime(b.createdAt, a.createdAt))
    .map(fromAlert('alerta-cerca'))

  const open = operations.filter((operation) => operation.stage !== 'cobrada')
  const dueDay = (operation: OperationRow) => (operation.dueDate ? argentinaDay(operation.dueDate) : null)

  const overdue = open
    .filter((operation) => {
      const day = dueDay(operation)
      return day !== null && day < today
    })
    .sort((a, b) => byTime(a.dueDate, b.dueDate))
    .map(fromOperation('vencida'))

  const dueToday = open
    .filter((operation) => dueDay(operation) === today)
    .sort((a, b) => byTime(a.dueDate, b.dueDate))
    .map(fromOperation('hoy'))

  const rest = open
    .filter((operation) => {
      const day = dueDay(operation)
      return day === null || day > today
    })
    .sort((a, b) => byTime(a.dueDate, b.dueDate))
    .map(fromOperation('abierta'))

  return [...alcanzado, ...overdue, ...dueToday, ...cerca, ...rest]
}
