'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { mutedStyle } from './styles'

type TickResult = { quotes?: number; alerts?: number; error?: string }

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** Runs one pass of the demo market so new Cotizaciones and Alertas appear. Any Usuario can. */
export function SimularCotizaciones() {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const run = () =>
    startTransition(async () => {
      setMessage(null)
      try {
        const res = await fetch('/api/feed/tick', { method: 'POST', credentials: 'include' })
        const body = (await res.json()) as TickResult
        const { quotes = 0, alerts = 0 } = body
        setMessage(
          body.error
            ? `Error: ${body.error}`
            : `Listo: ${count(quotes, 'Cotización simulada', 'Cotizaciones simuladas')} y ` +
                `${count(alerts, 'Alerta nueva', 'Alertas nuevas')}.`,
        )
        router.refresh()
      } catch {
        setMessage('No se pudo consultar el feed.')
      }
    })

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'calc(var(--base) / 2)' }}>
      <button
        type="button"
        className="btn btn--style-secondary btn--size-small"
        style={{ margin: 0 }}
        onClick={run}
        disabled={pending}
      >
        {pending ? 'Simulando…' : 'Simular cotizaciones'}
      </button>
      <span style={mutedStyle} role="status" aria-live="polite">
        {message}
      </span>
    </div>
  )
}
