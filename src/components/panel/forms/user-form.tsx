'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { TENANT_ROLES } from '@/domain'
import { saveUserAction } from '@/panel/actions/users'
import { initialFormState } from '@/panel/forms'

import { SelectField, TextField } from '../fields'
import { FormStatus } from '../form-status'

type Props = { user?: { id: number; name: string; email: string }; role?: string | null; tenantName: string }

export function UserForm({ user, role, tenantName }: Props) {
  const [state, action, pending] = useActionState(saveUserAction.bind(null, user?.id ?? null), initialFormState)
  const err = state.fieldErrors ?? {}

  return (
    <form action={action} className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField name="name" label="Nombre" defaultValue={user?.name} required error={err.name} autoComplete="off" />
        <TextField name="email" label="Email" type="email" defaultValue={user?.email} required error={err.email} autoComplete="off" />
        <SelectField
          name="role"
          label={`Rol en ${tenantName}`}
          options={TENANT_ROLES}
          defaultValue={role ?? 'comercial'}
          required
          hint="El Administrador gestiona Usuarios; el Comercial trabaja Operaciones y Precios gatillo."
          error={err.role}
        />
        <TextField
          name="password"
          label={user ? 'Nueva contraseña' : 'Contraseña'}
          type="password"
          required={!user}
          hint={user ? 'Dejala vacía para no cambiarla.' : 'Al menos 8 caracteres.'}
          error={err.password}
          autoComplete="new-password"
        />
      </div>
      <div className="flex flex-wrap items-center gap-4 border-t pt-4">
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : user ? 'Guardar cambios' : 'Crear Usuario'}
        </Button>
        <FormStatus state={state} />
      </div>
    </form>
  )
}
