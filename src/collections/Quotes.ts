import type { CollectionConfig } from 'payload'

import { authenticated, superAdminOnly } from '@/access'
import { alertOnQuote } from '@/alerts/onQuoteCreated'
import { QUOTE_SOURCES } from '@/domain'

// Cotización: a last-trade price written by the feed or entered by hand by the
// super-admin. Both paths run the same hooks; that is the demo path when the market is closed.
export const Quotes: CollectionConfig = {
  slug: 'quotes',
  labels: { singular: 'Cotización', plural: 'Cotizaciones' },
  admin: { defaultColumns: ['instrument', 'price', 'tradedAt', 'source'] },
  access: { create: superAdminOnly, read: authenticated, update: () => false, delete: superAdminOnly },
  hooks: { afterChange: [alertOnQuote] },
  fields: [
    {
      name: 'instrument',
      type: 'relationship',
      relationTo: 'instruments',
      label: 'Instrumento',
      required: true,
    },
    { name: 'price', type: 'number', label: 'Precio (último operado)', min: 0, required: true },
    { name: 'size', type: 'number', label: 'Cantidad' },
    {
      name: 'tradedAt',
      type: 'date',
      label: 'Hora de la operación',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    { name: 'bid', type: 'number', label: 'Mejor compra (bid)' },
    { name: 'offer', type: 'number', label: 'Mejor venta (offer)' },
    {
      name: 'source',
      type: 'select',
      label: 'Fuente',
      options: QUOTE_SOURCES,
      defaultValue: 'manual',
      required: true,
    },
  ],
}
