import type { CollectionAfterChangeHook } from 'payload'

import type { Contact, PriceTrigger, Quote, User } from '@/payload-types'

import { sendAlertEmail } from './email'
import { evaluate, isExpired } from './evaluate'
import { idOf } from './ids'

/**
 * Runs for every new Cotización, from the feed or entered by hand. System code: it reads and
 * writes across Empresas with access skipped, so every Alerta gets its tenant explicitly.
 */
export const alertOnQuote: CollectionAfterChangeHook<Quote> = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc

  const { payload } = req
  const now = new Date()
  const instrumentID = idOf(doc.instrument)
  if (instrumentID === undefined) return doc

  const instrument = await payload.findByID({
    collection: 'instruments',
    id: instrumentID,
    depth: 0,
    req,
  })

  const { docs: triggers } = await payload.find({
    collection: 'price-triggers',
    where: { and: [{ instrument: { equals: instrumentID } }, { status: { equals: 'activo' } }] },
    depth: 1,
    pagination: false,
    req,
  })

  for (const trigger of triggers) {
    if (isExpired(trigger, now)) {
      await payload.update({
        collection: 'price-triggers',
        id: trigger.id,
        data: { status: 'vencido' },
        req,
      })
      continue
    }

    const result = evaluate(trigger, { ...doc, instrument }, now)
    if (result === 'none') continue

    const alert = await payload.create({
      collection: 'alerts',
      data: {
        tenant: idOf(trigger.tenant),
        priceTrigger: trigger.id,
        quote: doc.id,
        kind: result,
      },
      req,
    })

    const triggerUpdate: Partial<PriceTrigger> =
      result === 'alcanzado' ? { status: 'alcanzado' } : { cercaNotifiedAt: now.toISOString() }
    await payload.update({ collection: 'price-triggers', id: trigger.id, data: triggerUpdate, req })

    const contact = await populated<Contact>(trigger.contact, (id) =>
      payload.findByID({ collection: 'contacts', id, depth: 0, req }),
    )
    const responsable = await populated<User>(trigger.responsable, (id) =>
      payload.findByID({ collection: 'users', id, depth: 0, req }),
    )
    // Detached on purpose: an SMTP round trip must not hold the Cotización's response. The demo
    // simulation writes several Cotizaciones in one request, so awaiting every email made the
    // dashboard button take ~19 s, past a serverless function's timeout. Failures are logged.
    void sendAlertEmail(req, { alert, trigger, quote: doc, instrument, contact, responsable }).catch(
      (err) =>
        req.payload.logger.error({ err, alert: alert.id }, 'No se pudo enviar el email de la Alerta'),
    )
  }

  return doc
}

const populated = async <T extends { id: number }>(
  value: number | T,
  load: (id: number) => Promise<T>,
): Promise<T> => (typeof value === 'object' ? value : load(value))
