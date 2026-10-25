'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type Base = { name: string; label: string; error?: string; hint?: string; className?: string; required?: boolean }

function Field({ name, label, error, hint, className, required, children }: Base & { children: React.ReactNode }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-muted-foreground" aria-hidden="true">*</span>}
      </Label>
      {children}
      {error ? (
        <p id={`${name}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${name}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

const describedBy = (name: string, error?: string, hint?: string) =>
  error ? `${name}-error` : hint ? `${name}-hint` : undefined

export function TextField({
  type = 'text',
  defaultValue,
  placeholder,
  step,
  min,
  autoComplete,
  ...base
}: Base & {
  type?: string
  defaultValue?: string | number | null
  placeholder?: string
  step?: string
  min?: string
  autoComplete?: string
}) {
  return (
    <Field {...base}>
      <Input
        id={base.name}
        name={base.name}
        type={type}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
        step={step}
        min={min}
        autoComplete={autoComplete}
        required={base.required}
        inputMode={type === 'number' ? 'decimal' : undefined}
        aria-invalid={Boolean(base.error) || undefined}
        aria-describedby={describedBy(base.name, base.error, base.hint)}
        className={type === 'number' ? 'font-mono tabular-nums' : undefined}
      />
    </Field>
  )
}

export function TextAreaField({ defaultValue, ...base }: Base & { defaultValue?: string | null }) {
  return (
    <Field {...base}>
      <Textarea
        id={base.name}
        name={base.name}
        defaultValue={defaultValue ?? ''}
        rows={3}
        aria-invalid={Boolean(base.error) || undefined}
        aria-describedby={describedBy(base.name, base.error, base.hint)}
      />
    </Field>
  )
}

export function SelectField({
  options,
  defaultValue,
  placeholder = 'Elegí una opción',
  allowEmpty,
  ...base
}: Base & {
  options: { label: string; value: string }[]
  defaultValue?: string | number | null
  placeholder?: string
  allowEmpty?: boolean
}) {
  return (
    <Field {...base}>
      <Select name={base.name} defaultValue={defaultValue != null ? String(defaultValue) : undefined} required={base.required}>
        <SelectTrigger
          id={base.name}
          className="w-full"
          aria-invalid={Boolean(base.error) || undefined}
          aria-describedby={describedBy(base.name, base.error, base.hint)}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allowEmpty && <SelectItem value="none">Sin asignar</SelectItem>}
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

export function CheckboxField({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string
  label: string
  hint?: string
  defaultChecked?: boolean | null
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border p-3">
      <Checkbox id={name} name={name} defaultChecked={Boolean(defaultChecked)} className="mt-0.5" />
      <div className="flex flex-col gap-1">
        <Label htmlFor={name}>{label}</Label>
        {hint && <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>}
      </div>
    </div>
  )
}
