import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access'
import { stampActivation } from '@/alerts/priceTriggerHooks'
import { TRIGGER_SIDES, TRIGGER_STATUSES } from '@/domain'
import { responsable } from '@/fields/responsable'
import { setUpdatedBy, updatedBy } from '@/fields/updatedBy'

// Precio gatillo: a Contacto's standing request to be told when an Instrumento
// trades at or beyond a Precio objetivo. It never executes anything.
export const PriceTriggers: CollectionConfig = {
  slug: 'price-triggers',
  labels: { singular: 'Precio gatillo', plural: 'Precios gatillo' },
  admin: {
    defaultColumns: ['contact', 'instrument', 'side', 'targetPrice', 'status', 'responsable'],
  },
  access: { create: authenticated, read: authenticated, update: authenticated, delete: authenticated },
  versions: true,
  hooks: { beforeChange: [setUpdatedBy, stampActivation] },
  fields: [
    { name: 'contact', type: 'relationship', relationTo: 'contacts', label: 'Contacto', required: true },
    {
      name: 'instrument',
      type: 'relationship',
      relationTo: 'instruments',
      label: 'Instrumento',
      required: true,
    },
    {
      name: 'side',
      type: 'select',
      label: 'Venta o compra',
      options: TRIGGER_SIDES,
      defaultValue: 'venta',
      required: true,
    },
    { name: 'targetPrice', type: 'number', label: 'Precio objetivo', min: 0, required: true },
    { name: 'deliveryConditions', type: 'textarea', label: 'Condiciones de entrega' },
    responsable,
    { name: 'validUntil', type: 'date', label: 'Vigencia' },
    {
      name: 'status',
      type: 'select',
      label: 'Estado',
      options: TRIGGER_STATUSES,
      defaultValue: 'activo',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'activatedAt',
      type: 'date',
      label: 'Activado',
      admin: { position: 'sidebar', readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'cercaNotifiedAt',
      type: 'date',
      label: 'Aviso de cerca enviado',
      admin: { position: 'sidebar', readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
    },
    updatedBy,
  ],
}
