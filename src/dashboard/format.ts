const priceFormatter = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const formatPrice = (value?: number | null) =>
  value == null ? '—' : priceFormatter.format(value)

export const labelOf = (options: { label: string; value: string }[], value?: string | null) =>
  options.find((option) => option.value === value)?.label ?? value ?? '—'
