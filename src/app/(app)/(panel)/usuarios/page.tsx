import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PageHeader } from '@/components/panel/page-header'
import { Pill } from '@/components/panel/status-badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { idOf, roleLabel } from '@/panel/labels'
import { getPanelContext } from '@/panel/session'

export default async function UsuariosPage() {
  const { payload, tenant, access, canManageUsers, user: me } = await getPanelContext()
  if (!canManageUsers || !tenant) notFound()
  const { docs } = await payload.find({
    collection: 'users',
    where: { 'tenants.tenant': { equals: tenant.id } },
    sort: 'name',
    depth: 0,
    limit: 200,
    ...access,
  })

  return (
    <>
      <PageHeader
        title="Usuarios"
        description={`Quiénes usan ShipAgro en ${tenant.name} y con qué rol.`}
        actions={
          <Button asChild>
            <Link href="/usuarios/nuevo">Nuevo Usuario</Link>
          </Button>
        }
      />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.map((u) => {
              const role = u.tenants?.find((row) => idOf(row.tenant) === tenant.id)?.role
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    <Link href={`/usuarios/${u.id}`} className="hover:underline">
                      {u.name}
                    </Link>
                    {u.id === me.id && <span className="ml-2 text-xs text-muted-foreground">(vos)</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Pill tone={role === 'administrador' ? 'primary' : 'muted'}>{roleLabel(role)}</Pill>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
