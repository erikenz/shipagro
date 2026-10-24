import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access'
import { CURRENCIES, GRAINS, STAGES } from '@/domain'
import { responsable } from '@/fields/responsable'
import { setUpdatedBy, updatedBy } from '@/fields/updatedBy'

// Operación: one grain deal between a Vendedor and a Comprador, followed through its Etapas.
export const Operations: CollectionConfig = {
  slug: 'operations',
  labels: { singular: 'Operación', plural: 'Operaciones' },
  admin: {
    defaultColumns: ['seller', 'buyer', 'grain', 'tons', 'stage', 'responsable', 'dueDate'],
  },
  access: { create: authenticated, read: authenticated, update: authenticated, delete: authenticated },
  versions: true,
  hooks: { beforeChange: [setUpdatedBy] },
  fields: [
    {
      name: 'seller',
      type: 'relationship',
      relationTo: 'contacts',
      label: 'Vendedor',
      // A Precio gatillo de compra opens an Operación with only the Comprador known.
      validate: (value: unknown, { data }: { data: Partial<{ buyer: unknown }> }) =>
        value || data?.buyer ? true : 'Indicá el Vendedor o el Comprador.',
    },
    { name: 'buyer', type: 'relationship', relationTo: 'contacts', label: 'Comprador' },
    { name: 'grain', type: 'select', label: 'Grano', options: GRAINS, required: true },
    { name: 'tons', type: 'number', label: 'Toneladas', min: 0 },
    { name: 'price', type: 'number', label: 'Precio por tonelada', min: 0 },
    { name: 'currency', type: 'select', label: 'Moneda', options: CURRENCIES, defaultValue: 'USD' },
    { name: 'deliveryConditions', type: 'textarea', label: 'Condiciones de entrega' },
    { name: 'aFijar', type: 'checkbox', label: 'A fijar', defaultValue: false },
    {
      name: 'stage',
      type: 'select',
      label: 'Etapa',
      options: STAGES,
      defaultValue: 'concertada',
      required: true,
    },
    responsable,
    { name: 'dueDate', type: 'date', label: 'Plazo' },
    {
      name: 'priceTrigger',
      type: 'relationship',
      relationTo: 'price-triggers',
      label: 'Precio gatillo de origen',
      admin: { readOnly: true },
    },
    updatedBy,
  ],
}
