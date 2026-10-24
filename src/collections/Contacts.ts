import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access'
import { CONTACT_TYPES } from '@/domain'

// Contacto: shared by every Usuario of its Empresa (the plugin adds `tenant`).
export const Contacts: CollectionConfig = {
  slug: 'contacts',
  labels: { singular: 'Contacto', plural: 'Contactos' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'type', 'locality', 'phone'] },
  access: { create: authenticated, read: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'name', type: 'text', label: 'Nombre', required: true },
    {
      name: 'type',
      type: 'select',
      label: 'Tipo',
      options: CONTACT_TYPES,
      defaultValue: 'productor',
      required: true,
    },
    { name: 'cuit', type: 'text', label: 'CUIT' },
    { name: 'phone', type: 'text', label: 'Teléfono' },
    { name: 'email', type: 'email', label: 'Email' },
    { name: 'locality', type: 'text', label: 'Localidad' },
  ],
}
