/** A relationship value is either the ID or, when populated, the document. */
export const idOf = <T extends number | string>(value: T | { id: T } | null | undefined): T | undefined =>
  value == null ? undefined : typeof value === 'object' ? value.id : value
