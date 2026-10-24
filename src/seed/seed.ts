import type { Payload } from 'payload'

import type { Instrument } from '@/payload-types'

export const SEED_PASSWORD = 'demo1234'

const DAY = 24 * 60 * 60 * 1000
const daysFromNow = (days: number) => new Date(Date.now() + days * DAY).toISOString()

/** Wipes ShipAgro data and loads a small development dataset. */
export async function seed(payload: Payload): Promise<void> {
  if (process.env.NODE_ENV === 'production') throw new Error('seed: refusing to wipe a production database')

  for (const collection of [
    'alerts',
    'operations',
    'price-triggers',
    'quotes',
    'contacts',
    'instruments',
    'users',
    'tenants',
  ] as const) {
    await payload.delete({ collection, where: { id: { exists: true } }, overrideAccess: true })
  }

  const pampa = await payload.create({ collection: 'tenants', data: { name: 'Corredora Pampa SA' } })
  const norte = await payload.create({ collection: 'tenants', data: { name: 'Acopio del Norte SRL' } })

  const user = (name: string, email: string, tenant: number, role: 'administrador' | 'comercial') =>
    payload.create({
      collection: 'users',
      data: { name, email, password: SEED_PASSWORD, tenants: [{ tenant, role }] },
    })

  await payload.create({
    collection: 'users',
    data: { name: 'Admin ShipAgro', email: 'admin@shipagro.test', password: SEED_PASSWORD, superAdmin: true },
  })
  const ana = await user('Ana Ferreyra', 'ana@pampa.test', pampa.id, 'administrador')
  const bruno = await user('Bruno Castro', 'bruno@pampa.test', pampa.id, 'comercial')
  await user('Carla Ruiz', 'carla@norte.test', norte.id, 'administrador')
  const diego = await user('Diego Paz', 'diego@norte.test', norte.id, 'comercial')

  // Placeholders until `pnpm feed` loads the real reMarkets list.
  const instrument = (symbol: string, grain: Instrument['grain'], month: string) =>
    payload.create({ collection: 'instruments', data: { symbol, grain, month, currency: 'USD' } })
  const sojaMay = await instrument('SOJ.ROS/MAY27', 'soja', 'MAY27')
  await instrument('SOJ.ROS/NOV26', 'soja', 'NOV26')
  const maizAbr = await instrument('MAI.ROS/ABR27', 'maiz', 'ABR27')
  await instrument('TRI.ROS/DIC26', 'trigo', 'DIC26')

  // Before the Precios gatillo, so these trades predate their activation and fire nothing.
  for (const [instrumentID, price] of [
    [sojaMay.id, 318],
    [maizAbr.id, 186],
  ]) {
    await payload.create({
      collection: 'quotes',
      data: { instrument: instrumentID, price, source: 'manual', tradedAt: new Date().toISOString() },
    })
  }

  const contact = (tenant: number, name: string, type: 'productor' | 'cooperativa' | 'exportadora' | 'industria', locality: string) =>
    payload.create({ collection: 'contacts', data: { tenant, name, type, locality } })
  const juan = await contact(pampa.id, 'Juan Pérez', 'productor', 'Pergamino')
  const esperanza = await contact(pampa.id, 'Estancia La Esperanza SA', 'productor', 'Junín')
  const union = await contact(pampa.id, 'Cooperativa Agrícola Unión', 'cooperativa', 'Venado Tuerto')
  const litoral = await contact(pampa.id, 'Exportadora del Litoral SA', 'exportadora', 'Rosario')
  const molino = await contact(pampa.id, 'Molino San Martín SA', 'industria', 'San Lorenzo')
  const marta = await contact(norte.id, 'Marta Gómez', 'productor', 'Charata')
  const aceitera = await contact(norte.id, 'Aceitera del Norte SA', 'industria', 'Avellaneda')

  const operations = [
    { tenant: pampa.id, seller: juan.id, buyer: litoral.id, grain: 'soja', tons: 500, price: 318, stage: 'confirmada', responsable: bruno.id, dueDate: daysFromNow(-1) },
    { tenant: pampa.id, seller: esperanza.id, buyer: molino.id, grain: 'trigo', tons: 300, price: 212, stage: 'en-entrega', responsable: ana.id, dueDate: daysFromNow(0) },
    { tenant: pampa.id, seller: union.id, buyer: litoral.id, grain: 'maiz', tons: 1000, aFijar: true, stage: 'concertada', responsable: bruno.id, dueDate: daysFromNow(3) },
    { tenant: norte.id, seller: marta.id, buyer: aceitera.id, grain: 'girasol', tons: 200, price: 410, stage: 'registrada', responsable: diego.id, dueDate: daysFromNow(1) },
  ] as const
  for (const data of operations) {
    await payload.create({ collection: 'operations', data: { ...data, currency: 'USD' } })
  }

  const triggers = [
    { tenant: pampa.id, contact: juan.id, instrument: sojaMay.id, targetPrice: 330, responsable: bruno.id },
    { tenant: pampa.id, contact: union.id, instrument: maizAbr.id, targetPrice: 195, responsable: ana.id },
    { tenant: norte.id, contact: marta.id, instrument: sojaMay.id, targetPrice: 325, responsable: diego.id },
  ]
  for (const data of triggers) {
    await payload.create({
      collection: 'price-triggers',
      data: { ...data, side: 'venta', status: 'activo', activatedAt: new Date().toISOString() },
    })
  }

  payload.logger.info(
    `seed: done. Log in at /admin as admin@shipagro.test, ana@pampa.test, bruno@pampa.test, carla@norte.test or diego@norte.test (password ${SEED_PASSWORD}).`,
  )
}
