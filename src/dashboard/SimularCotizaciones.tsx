'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

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
        setMessage('No se pudieron simular las Cotizaciones.')
      }
    })

  return (
    <>
      <button type="button" className="desk-text-link" onClick={run} disabled={pending}>
        {pending ? 'Simulando…' : 'Simular cotizaciones'}
      </button>
      <span className="desk-muted" role="status" aria-live="polite">
        {message}
      </span>
    </>
  )
}
