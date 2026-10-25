'use client'

import { RefreshCw, Shuffle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

type TickResult = { quotes?: number; alerts?: number; error?: string }

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export function DeskActions({ canSimulate }: { canSimulate: boolean }) {
  const router = useRouter()
  const [refreshing, startRefresh] = useTransition()
  const [simulating, startSimulate] = useTransition()

  const simulate = () =>
    startSimulate(async () => {
      try {
        const res = await fetch('/api/feed/tick', { method: 'POST', credentials: 'include' })
        const body = (await res.json()) as TickResult
        if (body.error) {
          toast.error(`Error: ${body.error}`)
        } else {
          const { quotes = 0, alerts = 0 } = body
          toast.success(
            `${count(quotes, 'Cotización simulada', 'Cotizaciones simuladas')} y ${count(alerts, 'Alerta nueva', 'Alertas nuevas')}.`,
          )
        }
        router.refresh()
      } catch {
        toast.error('No se pudieron simular las Cotizaciones.')
      }
    })

  return (
    <div className="flex items-center gap-2">
      {canSimulate && (
        <Button variant="outline" size="sm" onClick={simulate} disabled={simulating}>
          <Shuffle aria-hidden="true" />
          {simulating ? 'Simulando…' : 'Simular cotizaciones'}
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={() => startRefresh(() => router.refresh())} disabled={refreshing}>
        <RefreshCw aria-hidden="true" className={refreshing ? 'animate-spin' : undefined} />
        {refreshing ? 'Actualizando…' : 'Actualizar mesa'}
      </Button>
    </div>
  )
}
