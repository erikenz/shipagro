import type { PayloadRequest } from 'payload'

import { QUOTE_SOURCES, TRIGGER_SIDES } from '@/domain'
import type { Alert, Contact, Instrument, PriceTrigger, Quote, User } from '@/payload-types'

const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires'

const formatPrice = (value: number | null | undefined, currency: string): string =>
  typeof value === 'number'
    ? new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(value)
    : 'sin dato'

const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat('es-AR', {
    timeZone: ARGENTINA_TIME_ZONE,
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(value))

const escapeHtml = (text: string): string =>
  text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

const labelOf = (options: { label: string; value: string }[], value: string): string =>
  options.find((option) => option.value === value)?.label ?? value

type AlertEmailInput = {
  alert: Pick<Alert, 'id' | 'kind'>
  trigger: PriceTrigger
  quote: Quote
  instrument: Instrument
  contact: Contact
  responsable: User
}

/**
 * Emails the Responsable of the Precio gatillo. A failed send is logged, not thrown: the
 * Alerta is already saved and shows on the dashboard, and the Cotización must still be written.
 */
export async function sendAlertEmail(req: PayloadRequest, input: AlertEmailInput): Promise<void> {
  const { alert, trigger, quote, instrument, contact, responsable } = input
  if (!responsable.email) return

  const currency = instrument.currency ?? 'USD'
  const kindLabel = alert.kind === 'alcanzado' ? 'alcanzó' : 'está cerca de'
  const side = labelOf(TRIGGER_SIDES, trigger.side).toLowerCase()
  const source = labelOf(QUOTE_SOURCES, quote.source)
  const path = `/admin/collections/alerts/${alert.id}`
  const link = `${req.payload.config.serverURL || ''}${path}`

  const subject = `${alert.kind === 'alcanzado' ? 'Alcanzado' : 'Cerca'}: ${contact.name} · ${instrument.symbol} a ${formatPrice(quote.price, currency)}`

  const rows: [string, string][] = [
    ['Contacto', contact.name],
    ['Instrumento', instrument.symbol],
    ['Precio gatillo', `${side} a ${formatPrice(trigger.targetPrice, currency)}`],
    ['Último operado', formatPrice(quote.price, currency)],
    ['Hora de la operación', formatDateTime(quote.tradedAt)],
    ['Mejor compra (bid)', formatPrice(quote.bid, currency)],
    ['Mejor venta (offer)', formatPrice(quote.offer, currency)],
    ['Fuente', source],
  ]

  const intro =
    alert.kind === 'alcanzado'
      ? `El Precio gatillo de ${contact.name} ${kindLabel} su Precio objetivo. Quedó en pausa hasta que registres la Resolución (confirmar, actualizar o cancelar).`
      : `El Precio gatillo de ${contact.name} ${kindLabel} su Precio objetivo.`

  const text = [
    `Hola ${responsable.name},`,
    '',
    intro,
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    `Ver la Alerta: ${link}`,
    '',
    'ShipAgro no ejecuta operaciones: cualquier decisión es tuya.',
  ].join('\n')

  const html = `<p>Hola ${escapeHtml(responsable.name)},</p>
<p>${escapeHtml(intro)}</p>
<table cellpadding="4">${rows
    .map(([label, value]) => `<tr><th align="left">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`)
    .join('')}</table>
<p><a href="${escapeHtml(link)}">Ver la Alerta</a></p>
<p><small>ShipAgro no ejecuta operaciones: cualquier decisión es tuya.</small></p>`

  try {
    await req.payload.sendEmail({ to: responsable.email, subject, text, html })
  } catch (error) {
    req.payload.logger.error({ err: error, alert: alert.id }, 'No se pudo enviar el email de la Alerta')
  }
}
