import { Search } from 'lucide-react'
import Link from 'next/link'

import { EmptyState } from '@/components/panel/empty-state'
import { PageHeader } from '@/components/panel/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { contactTypeLabel } from '@/panel/labels'
import { getPanelContext } from '@/panel/session'

export default async function ContactosPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const { payload, tenantWhere, access } = await getPanelContext()
  const query = q.trim()
  const where = query
    ? {
        and: [
          tenantWhere,
          { or: [{ name: { like: query } }, { cuit: { like: query } }, { locality: { like: query } }] },
        ],
      }
    : tenantWhere
  const { docs } = await payload.find({ collection: 'contacts', where, sort: 'name', depth: 0, limit: 200, ...access })

  return (
    <>
      <PageHeader
        title="Contactos"
        description="Productores, acopios y compradores con los que trabaja la Empresa."
        actions={
          <Button asChild>
            <Link href="/contactos/nuevo">Nuevo Contacto</Link>
          </Button>
        }
      />
      <form role="search" className="relative max-w-sm">
        <label htmlFor="q" className="sr-only">
          Buscar Contactos
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input id="q" name="q" defaultValue={query} placeholder="Nombre, CUIT o localidad" className="pl-8" />
      </form>
      {docs.length === 0 ? (
        <EmptyState
          title={query ? 'Sin resultados' : 'Todavía no hay Contactos'}
          description={query ? `Nada coincide con “${query}”.` : undefined}
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>CUIT</TableHead>
                <TableHead>Localidad</TableHead>
                <TableHead>Teléfono</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link href={`/contactos/${c.id}`} className="hover:underline">
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell>{contactTypeLabel(c.type)}</TableCell>
                  <TableCell className="font-mono text-xs">{c.cuit ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{c.locality ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{c.phone ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
