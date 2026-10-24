'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { mutedStyle } from './styles'

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
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'calc(var(--base) / 2)' }}>
      <button
        type="button"
        className="btn btn--style-secondary btn--size-small"
        style={{ margin: 0 }}
        onClick={run}
        disabled={pending}
      >
        {pending ? 'Consultando…' : 'Actualizar precios ahora'}
      </button>
      <span style={mutedStyle} role="status" aria-live="polite">
        {message}
      </span>
    </div>
  )
}
