import { notFound } from 'next/navigation'

import { UserForm } from '@/components/panel/forms/user-form'
import { PageHeader } from '@/components/panel/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { getPanelContext } from '@/panel/session'

export default async function NuevoUsuarioPage() {
  const { tenant, canManageUsers } = await getPanelContext()
  if (!canManageUsers || !tenant) notFound()
  return (
    <>
      <PageHeader title="Nuevo Usuario" back={{ href: '/usuarios', label: 'Usuarios' }} />
      <Card className="max-w-3xl">
        <CardContent>
          <UserForm tenantName={tenant.name} />
        </CardContent>
      </Card>
    </>
  )
}
