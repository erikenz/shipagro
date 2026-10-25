import { OperationForm } from '@/components/panel/forms/operation-form'
import { PageHeader } from '@/components/panel/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { relationOptions } from '@/panel/options'
import { getPanelContext } from '@/panel/session'

export default async function NuevaOperacionPage() {
  const ctx = await getPanelContext()
  const { contacts, users } = await relationOptions(ctx)
  return (
    <>
      <PageHeader title="Nueva Operación" back={{ href: '/operaciones', label: 'Operaciones' }} />
      <Card className="max-w-4xl">
        <CardContent>
          <OperationForm contacts={contacts} users={users} defaultResponsable={ctx.user.id} />
        </CardContent>
      </Card>
    </>
  )
}
