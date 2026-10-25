'use client'

import { Building2, Check, ChevronsUpDown } from 'lucide-react'
import { useTransition } from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { selectTenantAction } from '@/panel/actions/auth'

type Props = { tenants: { id: number; name: string }[]; tenantID: number | null }

export function TenantSwitcher({ tenants, tenantID }: Props) {
  const [pending, startTransition] = useTransition()
  const current = tenants.find((t) => t.id === tenantID)
  if (!current) return null

  const trigger = (
    <SidebarMenuButton size="lg" tooltip={current.name} disabled={pending} className="border bg-background">
      <Building2 aria-hidden="true" />
      <div className="flex min-w-0 flex-col text-left leading-tight">
        <span className="text-xs text-muted-foreground">Empresa</span>
        <span className="truncate font-medium">{current.name}</span>
      </div>
      {tenants.length > 1 && <ChevronsUpDown className="ml-auto" aria-hidden="true" />}
    </SidebarMenuButton>
  )

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {tenants.length > 1 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width) min-w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Cambiar de Empresa</DropdownMenuLabel>
              {tenants.map((t) => (
                <DropdownMenuItem
                  key={t.id}
                  onSelect={() => startTransition(() => selectTenantAction(t.id))}
                >
                  <span className="truncate">{t.name}</span>
                  {t.id === tenantID && <Check className="ml-auto" aria-hidden="true" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          trigger
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
