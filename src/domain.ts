// Option lists for the domain terms in GLOSSARY.md. Values are the Spanish term in
// kebab-case; labels are what the admin shows.

/** The fixed sequence every Operación goes through, in order. */
export const STAGES = [
  { label: 'Concertada', value: 'concertada' },
  { label: 'Confirmada', value: 'confirmada' },
  { label: 'Registrada', value: 'registrada' },
  { label: 'En entrega', value: 'en-entrega' },
  { label: 'Entregada', value: 'entregada' },
  // Only for "a fijar" Operaciones.
  { label: 'Precio fijado', value: 'precio-fijado' },
  { label: 'Liquidada', value: 'liquidada' },
  { label: 'Cobrada', value: 'cobrada' },
]

export const GRAINS = [
  { label: 'Soja', value: 'soja' },
  { label: 'Maíz', value: 'maiz' },
  { label: 'Trigo', value: 'trigo' },
  { label: 'Girasol', value: 'girasol' },
  { label: 'Sorgo', value: 'sorgo' },
  { label: 'Cebada', value: 'cebada' },
]

export const CONTACT_TYPES = [
  { label: 'Productor', value: 'productor' },
  { label: 'Acopio', value: 'acopio' },
  { label: 'Cooperativa', value: 'cooperativa' },
  { label: 'Exportadora', value: 'exportadora' },
  { label: 'Industria', value: 'industria' },
  { label: 'Otro', value: 'otro' },
]

export const CURRENCIES = [
  { label: 'USD', value: 'USD' },
  { label: 'ARS', value: 'ARS' },
]

export const TENANT_ROLES = [
  { label: 'Administrador', value: 'administrador' },
  { label: 'Comercial', value: 'comercial' },
]

/** Venta fires at or above the Precio objetivo; compra at or below. */
export const TRIGGER_SIDES = [
  { label: 'Venta', value: 'venta' },
  { label: 'Compra', value: 'compra' },
]

export const TRIGGER_STATUSES = [
  { label: 'Activo', value: 'activo' },
  { label: 'Alcanzado', value: 'alcanzado' },
  { label: 'Confirmado', value: 'confirmado' },
  { label: 'Cancelado', value: 'cancelado' },
  { label: 'Vencido', value: 'vencido' },
]

export const ALERT_KINDS = [
  { label: 'Cerca', value: 'cerca' },
  { label: 'Alcanzado', value: 'alcanzado' },
]

export const RESOLUTIONS = [
  { label: 'Confirmar', value: 'confirmar' },
  { label: 'Actualizar precio objetivo', value: 'actualizar' },
  { label: 'Cancelar', value: 'cancelar' },
]

/** reMarkets is A3's test environment: never present its prices as real market data. */
export const QUOTE_SOURCES = [
  { label: 'reMarkets (prueba)', value: 'remarkets' },
  { label: 'Manual', value: 'manual' },
]
