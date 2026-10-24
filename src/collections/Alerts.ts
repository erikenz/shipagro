import type { CollectionConfig } from 'payload'

import { authenticated, superAdminOnly } from '@/access'
import { applyResolution } from '@/alerts/resolution'
import { ALERT_KINDS, RESOLUTIONS } from '@/domain'
import { setUpdatedBy, updatedBy } from '@/fields/updatedBy'

// Alerta: a Precio gatillo is near (cerca) or has reached (alcanzado) its Precio objetivo.
// System code creates them; Usuarios only record the Resolución.
export const Alerts: CollectionConfig = {
  slug: 'alerts',
  labels: { singular: 'Alerta', plural: 'Alertas' },
  admin: { defaultColumns: ['kind', 'priceTrigger', 'resolution', 'createdAt'] },
  access: { create: superAdminOnly, read: authenticated, update: authenticated, delete: superAdminOnly },
  versions: true,
  hooks: { beforeChange: [setUpdatedBy, applyResolution] },
  fields: [
    {
      name: 'priceTrigger',
      type: 'relationship',
      relationTo: 'price-triggers',
      label: 'Precio gatillo',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'quote',
      type: 'relationship',
      relationTo: 'quotes',
      label: 'Cotización',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'kind',
      type: 'select',
      label: 'Tipo',
      options: ALERT_KINDS,
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'resolution',
      type: 'select',
      label: 'Resolución',
      options: RESOLUTIONS,
      admin: { condition: (data) => data?.kind === 'alcanzado' },
    },
    {
      name: 'newTargetPrice',
      type: 'number',
      label: 'Nuevo precio objetivo',
      min: 0,
      admin: { condition: (data) => data?.resolution === 'actualizar' },
    },
    {
      name: 'resolvedBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'Resuelta por',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'resolvedAt',
      type: 'date',
      label: 'Resuelta el',
      admin: { position: 'sidebar', readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'operation',
      type: 'relationship',
      relationTo: 'operations',
      label: 'Operación creada',
      admin: { position: 'sidebar', readOnly: true },
    },
    updatedBy,
  ],
}
