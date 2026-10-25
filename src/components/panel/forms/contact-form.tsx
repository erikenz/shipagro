'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { CONTACT_TYPES } from '@/domain'
import { saveContactAction } from '@/panel/actions/contacts'
import { initialFormState } from '@/panel/forms'
import type { Contact } from '@/payload-types'

import { SelectField, TextField } from '../fields'
import { FormStatus } from '../form-status'

export function ContactForm({ contact }: { contact?: Contact }) {
  const [state, action, pending] = useActionState(saveContactAction.bind(null, contact?.id ?? null), initialFormState)
  const err = state.fieldErrors ?? {}

  return (
    <form action={action} className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField name="name" label="Nombre" defaultValue={contact?.name} required error={err.name} autoComplete="organization" />
        <SelectField name="type" label="Tipo" options={CONTACT_TYPES} defaultValue={contact?.type ?? 'productor'} required error={err.type} />
        <TextField name="cuit" label="CUIT" defaultValue={contact?.cuit} placeholder="30-12345678-9" error={err.cuit} />
        <TextField name="locality" label="Localidad" defaultValue={contact?.locality} error={err.locality} />
        <TextField name="phone" label="Teléfono" type="tel" defaultValue={contact?.phone} error={err.phone} autoComplete="tel" />
        <TextField name="email" label="Email" type="email" defaultValue={contact?.email} error={err.email} autoComplete="email" />
      </div>
      <div className="flex flex-wrap items-center gap-4 border-t pt-4">
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : contact ? 'Guardar cambios' : 'Crear Contacto'}
        </Button>
        <FormStatus state={state} />
      </div>
    </form>
  )
}
