'use client'

import { useActionState, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RESOLUTIONS } from '@/domain'
import { cn } from '@/lib/utils'
import { resolveAlertAction } from '@/panel/actions/alerts'
import { initialFormState } from '@/panel/forms'

import { TextField } from '../fields'
import { FormStatus } from '../form-status'

const hints: Record<string, string> = {
  confirmar: 'Cierra el Precio gatillo como confirmado y crea la Operación concertada.',
  actualizar: 'Vuelve a activar el Precio gatillo con un nuevo objetivo.',
  cancelar: 'Cancela el Precio gatillo. No se crea ninguna Operación.',
}

export function ResolveAlertForm({ alertID, currentTarget }: { alertID: number; currentTarget: number }) {
  const [state, action, pending] = useActionState(resolveAlertAction.bind(null, alertID), initialFormState)
  const [choice, setChoice] = useState('confirmar')

  return (
    <form action={action} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">¿Qué hacemos?</legend>
        {RESOLUTIONS.map((r) => (
          <Label
            key={r.value}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-md border p-3 font-normal has-[:checked]:border-primary has-[:checked]:bg-accent',
            )}
          >
            <input
              type="radio"
              name="resolution"
              value={r.value}
              checked={choice === r.value}
              onChange={() => setChoice(r.value)}
              className="mt-1 accent-primary"
            />
            <span className="flex flex-col gap-0.5">
              <span className="font-medium">{r.label}</span>
              <span className="text-xs leading-relaxed text-muted-foreground">{hints[r.value]}</span>
            </span>
          </Label>
        ))}
      </fieldset>
      {choice === 'actualizar' && (
        <TextField
          name="newTargetPrice"
          label="Nuevo Precio objetivo"
          type="number"
          step="any"
          min="0"
          defaultValue={currentTarget}
          required
          error={state.fieldErrors?.newTargetPrice}
        />
      )}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? 'Resolviendo…' : 'Resolver Alerta'}
        </Button>
        <FormStatus state={state} />
      </div>
    </form>
  )
}
