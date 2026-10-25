'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginAction } from '@/panel/actions/auth'
import { initialFormState } from '@/panel/forms'

import { FormError } from './form-error'

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialFormState)
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <FormError message={state.error} />
      <Button type="submit" disabled={pending}>
        {pending ? 'Ingresando…' : 'Ingresar'}
      </Button>
    </form>
  )
}
