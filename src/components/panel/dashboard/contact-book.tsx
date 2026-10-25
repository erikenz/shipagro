import Link from 'next/link'

import { EmptyState } from '@/components/panel/empty-state'
import { Pill } from '@/components/panel/status-badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatPrice } from '@/dashboard/format'
import type { Instrument } from '@/payload-types'
import { sideLabel, triggerStatusLabel } from '@/panel/labels'
import type { PanelContext } from '@/panel/session'
import { formatDay } from '@/pendientes/time'

export async function ContactBook({ ctx, now }: { ctx: PanelContext; now: Date }) {
  const { payload, tenantWhere, access } = ctx
  const contacts = await payload.find({
    collection: 'contacts',
    where: tenantWhere,
    sort: 'name',
    limit: 5,
    depth: 0,
    ...access,
  })
  const triggers = contacts.docs.length
    ? await payload.find({
        collection: 'price-triggers',
        where: {
          and: [
            tenantWhere,
            { contact: { in: contacts.docs.map((c) => c.id) } },
            { status: { in: ['activo', 'alcanzado'] } },
            { or: [{ validUntil: { exists: false } }, { validUntil: { greater_than_equal: now.toISOString() } }] },
          ],
        },
        sort: '-createdAt',
        pagination: false,
        depth: 1,
        ...access,
      })
    : null

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Cartera de Contactos</CardTitle>
        <span className="text-sm text-muted-foreground tabular-nums">{contacts.totalDocs} Contactos</span>
      </CardHeader>
      <CardContent className="px-0">
        {contacts.docs.length === 0 ? (
          <EmptyState
            title="Sin Contactos"
            description="Todavía no hay Contactos en esta Empresa. Cargá el primero para empezar el seguimiento."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Contacto</TableHead>
                <TableHead>Precio gatillo</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead className="pr-6">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.docs.map((contact) => {
                const active =
                  triggers?.docs.filter((t) => (typeof t.contact === 'object' ? t.contact.id : t.contact) === contact.id) ?? []
                const trigger = active[0]
                const instrument = trigger && typeof trigger.instrument === 'object' ? (trigger.instrument as Instrument) : null
                return (
                  <TableRow key={contact.id}>
                    <TableCell className="pl-6">
                      <Link href={`/contactos/${contact.id}`} className="flex flex-col hover:underline">
                        <span className="font-medium">{contact.name}</span>
                        <span className="text-xs text-muted-foreground">{contact.locality || 'Sin localidad'}</span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {trigger ? (
                        <Link href={`/gatillos/${trigger.id}`} className="flex flex-col hover:underline">
                          <span className="font-mono text-sm">{instrument?.symbol ?? 'Ver precio gatillo'}</span>
                          <span className="font-mono text-xs text-muted-foreground tabular-nums">
                            {formatPrice(trigger.targetPrice)} {instrument?.currency ?? '—'}/t · {sideLabel(trigger.side)}
                          </span>
                          {active.length > 1 && (
                            <span className="text-xs text-muted-foreground">+{active.length - 1} Precios gatillo</span>
                          )}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">Sin precios gatillo activos</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {trigger?.validUntil ? formatDay(trigger.validUntil) : '—'}
                    </TableCell>
                    <TableCell className="pr-6">
                      <Pill tone={trigger?.status === 'alcanzado' ? 'warning' : trigger ? 'primary' : 'muted'}>
                        {trigger ? triggerStatusLabel(trigger.status) : 'Sin activo'}
                      </Pill>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CardFooter>
        <Link href="/contactos" className="text-sm font-medium hover:underline">
          {contacts.hasNextPage ? `Ver los ${contacts.totalDocs} Contactos` : 'Gestionar Contactos'}
        </Link>
      </CardFooter>
    </Card>
  )
}
