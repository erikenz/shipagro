import { CircleCheck } from 'lucide-react'

import type { FormState } from '@/panel/forms'

import { FormError } from './form-error'

export function FormStatus({ state }: { state: FormState }) {
  if (state.error) return <FormError message={state.error} />
  if (state.ok && state.message) {
    return (
      <p role="status" className="flex items-center gap-2 text-sm text-primary">
        <CircleCheck className="size-4" aria-hidden="true" />
        {state.message}
      </p>
    )
  }
  return null
}
