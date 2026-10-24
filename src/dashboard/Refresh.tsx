'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

export default function Refresh() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <button
      className="desk-text-link"
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      {pending ? 'Actualizando…' : 'Actualizar mesa'}
    </button>
  )
}
