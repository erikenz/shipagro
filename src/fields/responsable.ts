import type { Field } from 'payload'

/** The Usuario accountable for a document. Defaults to whoever creates it. */
export const responsable: Field = {
  name: 'responsable',
  type: 'relationship',
  relationTo: 'users',
  label: 'Responsable',
  required: true,
  defaultValue: ({ user }) => user?.id,
  // Only offer Usuarios of the document's Empresa.
  filterOptions: ({ data }) => (data?.tenant ? { 'tenants.tenant': { equals: data.tenant } } : true),
}
