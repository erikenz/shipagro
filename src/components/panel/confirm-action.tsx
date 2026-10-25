'use client'

import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { FormState } from '@/panel/forms'

import { FormError } from './form-error'

type Props = {
  action: () => Promise<FormState | void>
  label: string
  title: string
  description: string
  confirmLabel?: string
  variant?: 'destructive' | 'outline' | 'default'
}

/** A button that asks before running a server action that can't be undone. */
export function ConfirmAction({ action, label, title, description, confirmLabel = label, variant = 'outline' }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant === 'destructive' ? 'outline' : variant} className={variant === 'destructive' ? 'text-destructive' : undefined}>
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <FormError message={error} />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Volver</Button>
          </DialogClose>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await action()
                if (result?.error) setError(result.error)
                else setOpen(false)
              })
            }
          >
            {pending ? 'Procesando…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
