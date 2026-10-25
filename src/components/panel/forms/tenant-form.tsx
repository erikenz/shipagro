'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { saveTenantAction } from '@/panel/actions/tenants'
import { initialFormState } from '@/panel/forms'

import { FormStatus } from '../form-status'

export function TenantForm({ tenant }: { tenant?: { id: number; name: string } }) {
  const [state, action, pending] = useActionState(saveTenantAction.bind(null, tenant?.id ?? null), initialFormState)
  const inputID = tenant ? `tenant-${tenant.id}` : 'tenant-new'
  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label htmlFor={inputID} className="sr-only">
          Nombre de la Empresa
        </label>
        <Input
          id={inputID}
          name="name"
          defaultValue={tenant?.name}
          placeholder="Nombre de la Empresa"
          required
          aria-invalid={Boolean(state.fieldErrors?.name) || undefined}
        />
        <Button type="submit" variant={tenant ? 'outline' : 'default'} disabled={pending}>
          {tenant ? 'Renombrar' : 'Crear'}
        </Button>
      </div>
      <FormStatus state={state.fieldErrors?.name ? { error: state.fieldErrors.name } : state} />
    </form>
  )
}
