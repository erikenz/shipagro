import {
  ALERT_KINDS,
  CONTACT_TYPES,
  GRAINS,
  RESOLUTIONS,
  STAGES,
  TENANT_ROLES,
  TRIGGER_SIDES,
  TRIGGER_STATUSES,
} from '@/domain'

type Option = { label: string; value: string }

const lookup = (options: Option[]) => (value?: string | null) =>
  options.find((o) => o.value === value)?.label ?? value ?? '—'

export const grainLabel = lookup(GRAINS)
export const stageLabel = lookup(STAGES)
export const contactTypeLabel = lookup(CONTACT_TYPES)
export const sideLabel = lookup(TRIGGER_SIDES)
export const triggerStatusLabel = lookup(TRIGGER_STATUSES)
export const alertKindLabel = lookup(ALERT_KINDS)
export const resolutionLabel = lookup(RESOLUTIONS)
export const roleLabel = lookup(TENANT_ROLES)

/** Stages an Operación can move to next; Precio fijado only applies to "a fijar" Operaciones. */
export const stagesFor = (aFijar?: boolean | null) =>
  STAGES.filter((s) => aFijar || s.value !== 'precio-fijado')

export const nextStage = (stage: string, aFijar?: boolean | null) => {
  const stages = stagesFor(aFijar)
  const index = stages.findIndex((s) => s.value === stage)
  return index >= 0 ? stages[index + 1] ?? null : null
}

/** A relation that may come populated or as a bare id. */
export const nameOf = (value: unknown, key: 'name' | 'symbol' = 'name'): string => {
  if (value && typeof value === 'object' && key in value) return String((value as Record<string, unknown>)[key])
  return '—'
}

export const idOf = (value: unknown): number | null => {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) return Number((value as { id: unknown }).id)
  return null
}
