import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// ADR 0001: isolation between Empresas is enforced by Payload, so it gets a test.
let payload: Payload
const suffix = Date.now()
const cleanup: Array<() => Promise<unknown>> = []

beforeAll(async () => {
  payload = await getPayload({ config })
})

afterAll(async () => {
  for (const undo of cleanup.reverse()) await undo()
})

describe('Empresas are isolated', () => {
  it("a Usuario sees their Empresa's Contactos and not another Empresa's", async () => {
    const tenantA = await payload.create({ collection: 'tenants', data: { name: `Test A ${suffix}` } })
    const tenantB = await payload.create({ collection: 'tenants', data: { name: `Test B ${suffix}` } })
    cleanup.push(
      () => payload.delete({ collection: 'tenants', id: tenantA.id }),
      () => payload.delete({ collection: 'tenants', id: tenantB.id }),
    )

    const userA = await payload.create({
      collection: 'users',
      data: {
        name: 'Test A',
        email: `a-${suffix}@test.local`,
        password: 'test-password',
        tenants: [{ tenant: tenantA.id, role: 'comercial' }],
      },
    })
    cleanup.push(() => payload.delete({ collection: 'users', id: userA.id }))

    const contactA = await payload.create({
      collection: 'contacts',
      data: { tenant: tenantA.id, name: 'Contacto A', type: 'productor' },
    })
    const contactB = await payload.create({
      collection: 'contacts',
      data: { tenant: tenantB.id, name: 'Contacto B', type: 'productor' },
    })
    cleanup.push(
      () => payload.delete({ collection: 'contacts', id: contactA.id }),
      () => payload.delete({ collection: 'contacts', id: contactB.id }),
    )

    const visible = await payload.find({
      collection: 'contacts',
      overrideAccess: false,
      user: { ...userA, collection: 'users' },
      limit: 1000,
    })
    const ids = visible.docs.map((doc) => doc.id)

    expect(ids).toContain(contactA.id)
    expect(ids).not.toContain(contactB.id)
  })
})
