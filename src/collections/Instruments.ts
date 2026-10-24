import type { CollectionConfig } from 'payload'

import { authenticated, superAdminOnly } from '@/access'
import { CURRENCIES, GRAINS } from '@/domain'

// Instrumento: an A3 contract. Shared market data, not owned by any Empresa.
export const Instruments: CollectionConfig = {
  slug: 'instruments',
  labels: { singular: 'Instrumento', plural: 'Instrumentos' },
  admin: { useAsTitle: 'symbol', defaultColumns: ['symbol', 'grain', 'month', 'currency', 'active'] },
  access: { create: superAdminOnly, read: authenticated, update: superAdminOnly, delete: superAdminOnly },
  fields: [
    {
      name: 'symbol',
      type: 'text',
      label: 'Símbolo A3',
      required: true,
      unique: true,
      admin: { description: 'Por ejemplo SOJ.ROS/MAY27' },
    },
    { name: 'grain', type: 'select', label: 'Grano', options: GRAINS },
    { name: 'month', type: 'text', label: 'Mes de entrega', admin: { description: 'Por ejemplo MAY27' } },
    { name: 'currency', type: 'select', label: 'Moneda', options: CURRENCIES, defaultValue: 'USD' },
    { name: 'lowLimitPrice', type: 'number', label: 'Límite diario inferior' },
    { name: 'highLimitPrice', type: 'number', label: 'Límite diario superior' },
    { name: 'active', type: 'checkbox', label: 'Activo', defaultValue: true },
  ],
}
