'use client'

import {
  Bell,
  Building2,
  ChartCandlestick,
  Crosshair,
  LayoutDashboard,
  ScrollText,
  UserCog,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

import { BrandMark } from './brand'
import { TenantSwitcher } from './tenant-switcher'
import { UserMenu } from './user-menu'

type Props = {
  user: { name: string; email: string }
  roleLabel: string
  tenants: { id: number; name: string }[]
  tenantID: number | null
  openAlerts: number
  canManageUsers: boolean
  superAdmin: boolean
}

export function AppSidebar({ user, roleLabel, tenants, tenantID, openAlerts, canManageUsers, superAdmin }: Props) {
  const pathname = usePathname()
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  const work = [
    { href: '/', label: 'Mesa', icon: LayoutDashboard },
    { href: '/alertas', label: 'Alertas', icon: Bell, badge: openAlerts },
    { href: '/gatillos', label: 'Precios gatillo', icon: Crosshair },
    { href: '/operaciones', label: 'Operaciones', icon: ScrollText },
    { href: '/contactos', label: 'Contactos', icon: Users },
    { href: '/mercado', label: 'Mercado', icon: ChartCandlestick },
  ]
  const admin = [
    ...(canManageUsers ? [{ href: '/usuarios', label: 'Usuarios', icon: UserCog }] : []),
    ...(superAdmin ? [{ href: '/empresas', label: 'Empresas', icon: Building2 }] : []),
  ]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1 py-1.5 group-data-[collapsible=icon]:px-0">
          <BrandMark />
          <span className="truncate font-bold tracking-tight group-data-[collapsible=icon]:hidden">
            ShipAgro
          </span>
        </div>
        <TenantSwitcher tenants={tenants} tenantID={tenantID} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Trabajo</SidebarGroupLabel>
          <SidebarMenu>
            {work.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.label}>
                  <Link href={item.href}>
                    <item.icon aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
                {item.badge ? (
                  <SidebarMenuBadge className="bg-warning text-warning-foreground">
                    <span className="sr-only">Alertas sin resolver: </span>
                    {item.badge}
                  </SidebarMenuBadge>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        {admin.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administración</SidebarGroupLabel>
            <SidebarMenu>
              {admin.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.label}>
                    <Link href={item.href}>
                      <item.icon aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <UserMenu user={user} roleLabel={roleLabel} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
