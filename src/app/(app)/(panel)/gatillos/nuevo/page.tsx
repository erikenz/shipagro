import { TriggerForm } from '@/components/panel/forms/trigger-form'
import { PageHeader } from '@/components/panel/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { relationOptions } from '@/panel/options'
import { getPanelContext } from '@/panel/session'

export default async function NuevoGatilloPage() {
  const ctx = await getPanelContext()
  const options = await relationOptions(ctx)
  return (
    <>
      <PageHeader title="Nuevo Precio gatillo" back={{ href: '/gatillos', label: 'Precios gatillo' }} />
      <Card className="max-w-3xl">
        <CardContent>
          <TriggerForm {...options} defaultResponsable={ctx.user.id} />
        </CardContent>
      </Card>
    </>
  )
}
