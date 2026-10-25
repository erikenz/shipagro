import { notFound } from 'next/navigation'

import { TenantForm } from '@/components/panel/forms/tenant-form'
import { PageHeader } from '@/components/panel/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPanelContext } from '@/panel/session'

export default async function EmpresasPage() {
  const { payload, access, superAdmin } = await getPanelContext()
  if (!superAdmin) notFound()
  const { docs } = await payload.find({ collection: 'tenants', sort: 'name', depth: 0, limit: 200, ...access })

  return (
    <>
      <PageHeader title="Empresas" description="Cada Empresa ve solo sus propios datos." />
      <div className="grid max-w-3xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nueva Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <TenantForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Existentes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {docs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no hay Empresas.</p>
            ) : (
              docs.map((t) => <TenantForm key={t.id} tenant={{ id: t.id, name: t.name }} />)
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
