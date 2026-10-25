import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ConfirmAction } from '@/components/panel/confirm-action'
import { ContactForm } from '@/components/panel/forms/contact-form'
import { PageHeader } from '@/components/panel/page-header'
import { StageBadge, TriggerStatus } from '@/components/panel/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice } from '@/dashboard/format'
import { deleteContactAction } from '@/panel/actions/contacts'
import { contactTypeLabel, grainLabel, nameOf } from '@/panel/labels'
import { getPanelContext } from '@/panel/session'

export default async function ContactoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { payload, access, canManageUsers } = await getPanelContext()
  const contact = await payload.findByID({ collection: 'contacts', id: Number(id), depth: 0, ...access }).catch(() => null)
  if (!contact) notFound()

  const [triggers, operations] = await Promise.all([
    payload.find({
      collection: 'price-triggers',
      where: { contact: { equals: contact.id } },
      sort: '-createdAt',
      depth: 1,
      limit: 20,
      ...access,
    }),
    payload.find({
      collection: 'operations',
      where: { or: [{ seller: { equals: contact.id } }, { buyer: { equals: contact.id } }] },
      sort: '-updatedAt',
      depth: 0,
      limit: 20,
      ...access,
    }),
  ])

  return (
    <>
      <PageHeader
        title={contact.name}
        description={contactTypeLabel(contact.type)}
        back={{ href: '/contactos', label: 'Contactos' }}
        actions={
          canManageUsers ? (
            <ConfirmAction
              action={deleteContactAction.bind(null, contact.id)}
              label="Eliminar"
              title={`¿Eliminar a ${contact.name}?`}
              description="Solo se puede si no tiene Precios gatillo ni Operaciones."
              confirmLabel="Sí, eliminar"
              variant="destructive"
            />
          ) : null
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Datos</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactForm contact={contact} />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Precios gatillo</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              {triggers.docs.length === 0 ? (
                <p className="px-6 text-sm text-muted-foreground">Ninguno.</p>
              ) : (
                <ul className="divide-y">
                  {triggers.docs.map((t) => (
                    <li key={t.id}>
                      <Link href={`/gatillos/${t.id}`} className="flex items-center justify-between gap-3 px-6 py-2.5 hover:bg-muted/50">
                        <span className="font-mono text-xs">{nameOf(t.instrument, 'symbol')}</span>
                        <span className="font-mono text-sm tabular-nums">{formatPrice(t.targetPrice)}</span>
                        <TriggerStatus status={t.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Operaciones</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              {operations.docs.length === 0 ? (
                <p className="px-6 text-sm text-muted-foreground">Ninguna.</p>
              ) : (
                <ul className="divide-y">
                  {operations.docs.map((op) => (
                    <li key={op.id}>
                      <Link href={`/operaciones/${op.id}`} className="flex items-center justify-between gap-3 px-6 py-2.5 hover:bg-muted/50">
                        <span className="text-sm">{grainLabel(op.grain)}</span>
                        <span className="font-mono text-sm tabular-nums">{op.tons ? `${op.tons} t` : '—'}</span>
                        <StageBadge stage={op.stage} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
