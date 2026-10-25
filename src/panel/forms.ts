import { APIError, ValidationError } from 'payload'

export type FormState = {
  error?: string
  fieldErrors?: Record<string, string>
  ok?: boolean
  message?: string
}

export const initialFormState: FormState = {}

/** Turns what Payload throws into a message the form can show next to the fields. */
export function toFormState(err: unknown): FormState {
  if (err instanceof ValidationError) {
    const fieldErrors = Object.fromEntries(
      (err.data?.errors ?? []).map((e) => [e.path, e.message] as const),
    )
    return { error: 'Revisá los campos marcados.', fieldErrors }
  }
  if (err instanceof APIError) return { error: err.message }
  console.error(err)
  return { error: 'No se pudo guardar. Intentá de nuevo.' }
}

export const text = (form: FormData, key: string): string | null => {
  const value = form.get(key)
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' || trimmed === 'none' ? null : trimmed
}

export const number = (form: FormData, key: string): number | null => {
  const value = text(form, key)
  if (value === null) return null
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

export const id = (form: FormData, key: string): number | null => {
  const value = number(form, key)
  return value !== null && Number.isInteger(value) ? value : null
}

export const checkbox = (form: FormData, key: string): boolean => {
  const value = form.get(key)
  return value === 'on' || value === 'true'
}

/** A `YYYY-MM-DD` day stored at noon UTC (09:00 Argentina), as the seed and hooks do. */
export const day = (form: FormData, key: string): string | null => {
  const value = text(form, key)
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00.000Z` : null
}

/** The `YYYY-MM-DD` to prefill a date input with. */
export const toDayInput = (value?: string | null): string => (value ? value.slice(0, 10) : '')
