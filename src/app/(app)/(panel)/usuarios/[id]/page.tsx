import { notFound } from 'next/navigation'

import { ConfirmAction } from '@/components/panel/confirm-action'
import { UserForm } from '@/components/panel/forms/user-form'
import { PageHeader } from '@/components/panel/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { removeFromTenantAction } from '@/panel/actions/users'
import { idOf } from '@/panel/labels'
import { getPanelContext } from '@/panel/session'

export default async function UsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { payload, tenant, access, canManageUsers, user: me } = await getPanelContext()
  if (!canManageUsers || !tenant) notFound()
  const user = await payload.findByID({ collection: 'users', id: Number(id), depth: 0, ...access }).catch(() => null)
  const row = user?.tenants?.find((r) => idOf(r.tenant) === tenant.id)
  if (!user || !row) notFound()

  return (
    <>
      <PageHeader
        title={user.name}
        description={user.email}
        back={{ href: '/usuarios', label: 'Usuarios' }}
        actions={
          user.id !== me.id ? (
            <ConfirmAction
              action={removeFromTenantAction.bind(null, user.id)}
              label="Quitar de la Empresa"
              title={`¿Quitar a ${user.name} de ${tenant.name}?`}
              description="Pierde el acceso a esta Empresa. Su cuenta y sus otras Empresas no cambian."
              confirmLabel="Sí, quitar"
              variant="destructive"
            />
          ) : null
        }
      />
      <Card className="max-w-3xl">
        <CardContent>
          <UserForm user={{ id: user.id, name: user.name, email: user.email }} role={row.role} tenantName={tenant.name} />
        </CardContent>
      </Card>
    </>
  )
}
