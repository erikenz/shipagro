'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { CURRENCIES, GRAINS, STAGES } from '@/domain'
import { saveOperationAction } from '@/panel/actions/operations'
import { initialFormState, toDayInput } from '@/panel/forms'
import type { Operation } from '@/payload-types'

import { CheckboxField, SelectField, TextAreaField, TextField } from '../fields'
import { FormStatus } from '../form-status'

type Option = { label: string; value: string }

type Props = {
  operation?: Operation
  contacts: Option[]
  users: Option[]
  defaultResponsable: number
}

const relID = (value: unknown) => (value && typeof value === 'object' && 'id' in value ? (value as { id: number }).id : (value as number | null))

export function OperationForm({ operation, contacts, users, defaultResponsable }: Props) {
  const [state, action, pending] = useActionState(saveOperationAction.bind(null, operation?.id ?? null), initialFormState)
  const err = state.fieldErrors ?? {}

  return (
    <form action={action} className="flex flex-col gap-6">
      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-3 text-sm font-semibold">Partes</legend>
        <SelectField name="seller" label="Vendedor" options={contacts} defaultValue={relID(operation?.seller)} allowEmpty error={err.seller} />
        <SelectField name="buyer" label="Comprador" options={contacts} defaultValue={relID(operation?.buyer)} allowEmpty error={err.buyer} />
      </fieldset>

      <fieldset className="grid gap-4 md:grid-cols-4">
        <legend className="mb-3 text-sm font-semibold">Negocio</legend>
        <SelectField name="grain" label="Grano" options={GRAINS} defaultValue={operation?.grain} required error={err.grain} />
        <TextField name="tons" label="Toneladas" type="number" step="any" min="0" defaultValue={operation?.tons} error={err.tons} />
        <TextField name="price" label="Precio" type="number" step="any" min="0" defaultValue={operation?.price} error={err.price} />
        <SelectField name="currency" label="Moneda" options={CURRENCIES} defaultValue={operation?.currency ?? 'USD'} error={err.currency} />
        <TextAreaField
          name="deliveryConditions"
          label="Condiciones de entrega"
          defaultValue={operation?.deliveryConditions}
          className="md:col-span-4"
          error={err.deliveryConditions}
        />
        <div className="md:col-span-4">
          <CheckboxField
            name="aFijar"
            label="A fijar"
            hint="El precio se fija más adelante. Agrega la etapa Precio fijado antes de Liquidada."
            defaultChecked={operation?.aFijar}
          />
        </div>
      </fieldset>

      <fieldset className="grid gap-4 md:grid-cols-3">
        <legend className="mb-3 text-sm font-semibold">Seguimiento</legend>
        <SelectField name="stage" label="Etapa" options={STAGES} defaultValue={operation?.stage ?? 'concertada'} required error={err.stage} />
        <SelectField
          name="responsable"
          label="Responsable"
          options={users}
          defaultValue={relID(operation?.responsable) ?? defaultResponsable}
          required
          error={err.responsable}
        />
        <TextField name="dueDate" label="Próximo vencimiento" type="date" defaultValue={toDayInput(operation?.dueDate)} error={err.dueDate} />
      </fieldset>

      <div className="flex flex-wrap items-center gap-4 border-t pt-4">
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : operation ? 'Guardar cambios' : 'Crear Operación'}
        </Button>
        <FormStatus state={state} />
      </div>
    </form>
  )
}
