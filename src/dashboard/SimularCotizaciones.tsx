'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

type TickResult = { polled?: number; error?: string }

/** Super-admin only: runs one pass of the (mock) feed so new Cotizaciones and Alertas appear. */
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
        setMessage(
          body.error
            ? `Error: ${body.error}`
            : `Listo: ${body.polled ?? 0} instrumento(s) consultado(s).`,
        )
        router.refresh()
      } catch {
        setMessage('No se pudo consultar el feed.')
      }
    })

  return (
    <div className="desk-feed-action">
      <button
        type="button"
        className="desk-text-link"
        onClick={run}
        disabled={pending}
      >
        {pending ? 'Consultando…' : 'Actualizar precios ahora'}
      </button>
      <span className="desk-muted" role="status" aria-live="polite">
        {message}
      </span>
    </div>
  )
}
