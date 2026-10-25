import { AppSidebar } from '@/components/panel/app-sidebar'
import { QuoteTicker } from '@/components/panel/quote-ticker'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { getPanelContext } from '@/panel/session'

export const dynamic = 'force-dynamic'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { payload, user, tenants, tenant, role, superAdmin, canManageUsers, tenantWhere, access } =
    await getPanelContext()

  const { totalDocs: openAlerts } = await payload.count({
    collection: 'alerts',
    where: { and: [tenantWhere, { kind: { equals: 'alcanzado' } }, { resolution: { exists: false } }] },
    ...access,
  })

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar
          user={{ name: user.name, email: user.email }}
          roleLabel={superAdmin ? 'Super-admin' : role === 'administrador' ? 'Administrador' : 'Comercial'}
          tenants={tenants.map((t) => ({ id: t.id, name: t.name }))}
          tenantID={tenant?.id ?? null}
          openAlerts={openAlerts}
          canManageUsers={canManageUsers}
          superAdmin={superAdmin}
        />
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-5" />
            <QuoteTicker />
          </header>
          <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            {tenant ? (
              children
            ) : (
              <div className="mx-auto flex max-w-md flex-col gap-2 py-16 text-center">
                <h1 className="text-lg font-semibold">Todavía no tenés una Empresa asignada</h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {superAdmin
                    ? 'Creá la primera Empresa desde Empresas para empezar a cargar datos.'
                    : 'Pedile al Administrador de tu Empresa que te agregue.'}
                </p>
              </div>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
