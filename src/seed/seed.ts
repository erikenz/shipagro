import type { Payload } from 'payload'

import type { Contact, Instrument, Operation, PriceTrigger } from '@/payload-types'

export const SEED_PASSWORD = 'demo1234'

const DAY = 24 * 60 * 60 * 1000
const daysFromNow = (days: number) => new Date(Date.now() + days * DAY).toISOString()

/** Wipes ShipAgro data and loads the demo dataset described in docs/demo.md. */
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
  const carla = await user('Carla Ruiz', 'carla@norte.test', norte.id, 'administrador')
  const diego = await user('Diego Paz', 'diego@norte.test', norte.id, 'comercial')

  // Placeholders until `pnpm feed` loads the real reMarkets list.
  const instrument = (symbol: string, grain: Instrument['grain'], month: string) =>
    payload.create({ collection: 'instruments', data: { symbol, grain, month, currency: 'USD' } })
  const sojaMay = await instrument('SOJ.ROS/MAY27', 'soja', 'MAY27')
  await instrument('SOJ.ROS/NOV26', 'soja', 'NOV26')
  const maizAbr = await instrument('MAI.ROS/ABR27', 'maiz', 'ABR27')
  const trigoDic = await instrument('TRI.ROS/DIC26', 'trigo', 'DIC26')

  // Before the Precios gatillo, so these trades predate their activation and fire nothing.
  // docs/demo.md moves prices from these values.
  for (const [instrumentID, price] of [
    [sojaMay.id, 318],
    [maizAbr.id, 186],
    [trigoDic.id, 210],
  ]) {
    await payload.create({
      collection: 'quotes',
      data: { instrument: instrumentID, price, source: 'manual', tradedAt: new Date().toISOString() },
    })
  }

  const contact = (
    tenant: number,
    name: string,
    type: Contact['type'],
    locality: string,
    extra: Partial<Pick<Contact, 'cuit' | 'phone' | 'email'>> = {},
  ) => payload.create({ collection: 'contacts', data: { tenant, name, type, locality, ...extra } })

  // Corredora Pampa SA
  const juan = await contact(pampa.id, 'Juan Pérez', 'productor', 'Pergamino', { phone: '+54 2477 41-2233' })
  const esperanza = await contact(pampa.id, 'Estancia La Esperanza SA', 'productor', 'Junín', { cuit: '30-71234567-8' })
  const sofia = await contact(pampa.id, 'Sofía Bianchi', 'productor', 'Salto', { email: 'sofia.bianchi@example.com' })
  const union = await contact(pampa.id, 'Cooperativa Agrícola Unión', 'cooperativa', 'Venado Tuerto')
  const sanJose = await contact(pampa.id, 'Acopio San José SRL', 'acopio', 'Rojas')
  const litoral = await contact(pampa.id, 'Exportadora del Litoral SA', 'exportadora', 'Rosario', { cuit: '30-70987654-3' })
  const puerto = await contact(pampa.id, 'Granos del Puerto SA', 'exportadora', 'Timbúes')
  const molino = await contact(pampa.id, 'Molino San Martín SA', 'industria', 'San Lorenzo')
  await contact(pampa.id, 'Transportes Ruta 8', 'otro', 'Pergamino', { phone: '+54 2477 43-9000' })

  // Acopio del Norte SRL
  const marta = await contact(norte.id, 'Marta Gómez', 'productor', 'Charata', { phone: '+54 3731 42-1100' })
  const ruben = await contact(norte.id, 'Rubén Acosta', 'productor', 'Las Breñas')
  const chaco = await contact(norte.id, 'Cooperativa Chaqueña Ltda.', 'cooperativa', 'Sáenz Peña')
  const aceitera = await contact(norte.id, 'Aceitera del Norte SA', 'industria', 'Avellaneda', { cuit: '30-65432109-7' })
  await contact(norte.id, 'Exportadora Paraná SA', 'exportadora', 'San Lorenzo')
  await contact(norte.id, 'Acopio Santiago SRL', 'acopio', 'Quimilí')

  type OperationSeed = Omit<Operation, 'id' | 'createdAt' | 'updatedAt' | 'currency'>
  // One per Etapa. Overdue and due-today rows feed Mis pendientes.
  const operations: OperationSeed[] = [
    { tenant: pampa.id, seller: union.id, buyer: litoral.id, grain: 'maiz', tons: 1000, aFijar: true, stage: 'concertada', responsable: bruno.id, dueDate: daysFromNow(3) },
    { tenant: pampa.id, seller: juan.id, buyer: litoral.id, grain: 'soja', tons: 500, price: 318, stage: 'confirmada', responsable: bruno.id, dueDate: daysFromNow(-1) },
    { tenant: pampa.id, seller: sofia.id, buyer: puerto.id, grain: 'soja', tons: 250, price: 315, stage: 'registrada', responsable: bruno.id, dueDate: daysFromNow(-3) },
    { tenant: pampa.id, seller: esperanza.id, buyer: molino.id, grain: 'trigo', tons: 300, price: 212, stage: 'en-entrega', responsable: ana.id, dueDate: daysFromNow(0) },
    { tenant: pampa.id, seller: sanJose.id, buyer: puerto.id, grain: 'maiz', tons: 800, price: 184, stage: 'entregada', responsable: ana.id, dueDate: daysFromNow(5) },
    { tenant: pampa.id, seller: esperanza.id, buyer: litoral.id, grain: 'soja', tons: 400, aFijar: true, price: 320, stage: 'precio-fijado', responsable: ana.id, dueDate: daysFromNow(7) },
    { tenant: norte.id, seller: marta.id, buyer: aceitera.id, grain: 'girasol', tons: 200, price: 410, stage: 'liquidada', responsable: diego.id, dueDate: daysFromNow(-2) },
    { tenant: norte.id, seller: ruben.id, buyer: aceitera.id, grain: 'sorgo', tons: 350, price: 160, stage: 'cobrada', responsable: carla.id, dueDate: daysFromNow(-10) },
    { tenant: norte.id, seller: chaco.id, buyer: aceitera.id, grain: 'girasol', tons: 600, price: 405, stage: 'confirmada', responsable: diego.id, dueDate: daysFromNow(2) },
  ]
  for (const data of operations) {
    await payload.create({ collection: 'operations', data: { ...data, currency: 'USD' } })
  }

  type TriggerSeed = Pick<PriceTrigger, 'tenant' | 'contact' | 'instrument' | 'side' | 'targetPrice' | 'responsable'>
  // 1–3% from the latest Cotización. Cerca fires at 99% of the target (101% for compra),
  // so a hand-entered price walks each one through cerca, then alcanzado.
  const triggers: TriggerSeed[] = [
    // 318 → 322 is cerca, 325 is alcanzado.
    { tenant: pampa.id, contact: juan.id, instrument: sojaMay.id, side: 'venta', targetPrice: 325, responsable: bruno.id },
    // 186 → 189 is cerca, 190 is alcanzado.
    { tenant: pampa.id, contact: union.id, instrument: maizAbr.id, side: 'venta', targetPrice: 190, responsable: ana.id },
    // Compra: 210 → 208 is cerca, 206 is alcanzado.
    { tenant: pampa.id, contact: molino.id, instrument: trigoDic.id, side: 'compra', targetPrice: 206, responsable: ana.id },
    // Same Instrumento, other Empresa: 325 only brings it to cerca, 327 reaches it.
    { tenant: norte.id, contact: marta.id, instrument: sojaMay.id, side: 'venta', targetPrice: 327, responsable: diego.id },
  ]
  for (const data of triggers) {
    await payload.create({
      collection: 'price-triggers',
      data: { ...data, status: 'activo', activatedAt: new Date().toISOString() },
    })
  }

  payload.logger.info(
    `seed: done. Log in at /admin as admin@shipagro.test, ana@pampa.test, bruno@pampa.test, carla@norte.test or diego@norte.test (password ${SEED_PASSWORD}). Demo script: docs/demo.md.`,
  )
}
