import type { CollectionBeforeChangeHook, Field } from 'payload'

// Payload 3 has no built-in authorship: this field plus version history shows who
// changed what (RF10). Writes by system code (no user) leave it unchanged.
export const updatedBy: Field = {
  name: 'updatedBy',
  type: 'relationship',
  relationTo: 'users',
  label: 'Modificado por',
  admin: { position: 'sidebar', readOnly: true },
}

export const setUpdatedBy: CollectionBeforeChangeHook = ({ data, req }) => {
  if (req.user) data.updatedBy = req.user.id
  return data
}
