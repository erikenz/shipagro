'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { TRIGGER_SIDES } from '@/domain'
import { saveTriggerAction } from '@/panel/actions/triggers'
import { initialFormState, toDayInput } from '@/panel/forms'
import type { PriceTrigger } from '@/payload-types'

import { SelectField, TextAreaField, TextField } from '../fields'
import { FormStatus } from '../form-status'

type Option = { label: string; value: string }

type Props = {
  trigger?: PriceTrigger
  contacts: Option[]
  instruments: Option[]
  users: Option[]
  defaultResponsable: number
}

const relID = (value: unknown) => (value && typeof value === 'object' && 'id' in value ? (value as { id: number }).id : (value as number | null))

export function TriggerForm({ trigger, contacts, instruments, users, defaultResponsable }: Props) {
  const [state, action, pending] = useActionState(saveTriggerAction.bind(null, trigger?.id ?? null), initialFormState)
  const err = state.fieldErrors ?? {}

  return (
    <form action={action} className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField name="contact" label="Contacto" options={contacts} defaultValue={relID(trigger?.contact)} required error={err.contact} />
        <SelectField
          name="instrument"
          label="Instrumento"
          options={instruments}
          defaultValue={relID(trigger?.instrument)}
          required
          error={err.instrument}
        />
        <SelectField
          name="side"
          label="Lado"
          options={TRIGGER_SIDES}
          defaultValue={trigger?.side ?? 'venta'}
          required
          hint="Venta avisa cuando el precio sube hasta el objetivo; compra, cuando baja."
          error={err.side}
        />
        <TextField
          name="targetPrice"
          label="Precio objetivo"
          type="number"
          step="any"
          min="0"
          defaultValue={trigger?.targetPrice}
          required
          error={err.targetPrice}
        />
        <SelectField
          name="responsable"
          label="Responsable"
          options={users}
          defaultValue={relID(trigger?.responsable) ?? defaultResponsable}
          required
          error={err.responsable}
        />
        <TextField
          name="validUntil"
          label="Válido hasta"
          type="date"
          defaultValue={toDayInput(trigger?.validUntil)}
          hint="Vacío: sigue activo hasta que se alcance o se cancele."
          error={err.validUntil}
        />
        <TextAreaField
          name="deliveryConditions"
          label="Condiciones de entrega"
          defaultValue={trigger?.deliveryConditions}
          className="md:col-span-2"
          error={err.deliveryConditions}
        />
      </div>
      <div className="flex flex-wrap items-center gap-4 border-t pt-4">
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : trigger ? 'Guardar cambios' : 'Crear Precio gatillo'}
        </Button>
        <FormStatus state={state} />
      </div>
    </form>
  )
}
