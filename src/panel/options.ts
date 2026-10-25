import type { PanelContext } from './session'

type Option = { label: string; value: string }

/** Select options for the relations a form needs, scoped to the selected Empresa. */
export async function relationOptions(ctx: PanelContext) {
  const { payload, tenant, tenantWhere, access } = ctx
  const [contacts, users, instruments] = await Promise.all([
    payload.find({ collection: 'contacts', where: tenantWhere, sort: 'name', depth: 0, pagination: false, ...access }),
    payload.find({
      collection: 'users',
      where: { 'tenants.tenant': { equals: tenant?.id ?? -1 } },
      sort: 'name',
      depth: 0,
      pagination: false,
      ...access,
    }),
    payload.find({
      collection: 'instruments',
      where: { active: { equals: true } },
      sort: 'symbol',
      depth: 0,
      pagination: false,
      ...access,
    }),
  ])
  const toOptions = <T extends { id: number }>(docs: T[], label: (doc: T) => string): Option[] =>
    docs.map((doc) => ({ value: String(doc.id), label: label(doc) }))

  const userOptions = toOptions(users.docs, (u) => u.name)
  if (!userOptions.some((o) => o.value === String(ctx.user.id))) {
    userOptions.unshift({ value: String(ctx.user.id), label: ctx.user.name })
  }

  return {
    contacts: toOptions(contacts.docs, (c) => c.name),
    users: userOptions,
    instruments: toOptions(instruments.docs, (i) => i.symbol),
  }
}
