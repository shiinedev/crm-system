"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronsUpDown, Plus, Check } from "lucide-react"
import { organization } from "@/server/auth/auth-client"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"

export type SwitcherOrg = { id: string; name: string; slug?: string | null; logo?: string | null }

interface OrgSwitcherProps {
  organizations: SwitcherOrg[]
  activeOrganizationId: string | null
}

/**
 * Organization switcher rendered in the sidebar header. Seeded with server data
 * (active org + list) so it shows the current organization immediately on every
 * load — no client fetch, no "Select org" flash.
 */
export function OrgSwitcher({ organizations, activeOrganizationId }: OrgSwitcherProps) {
  const router = useRouter()
  const { isMobile } = useSidebar()
  const [pending, setPending] = useState(false)

  const active =
    organizations.find((o) => o.id === activeOrganizationId) ?? organizations[0] ?? null

  async function switchOrg(orgId: string) {
    if (orgId === active?.id || pending) return
    setPending(true)
    const { error } = await organization.setActive({ organizationId: orgId })
    if (error) {
      setPending(false)
      return
    }
    router.refresh()
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={active?.name ?? "Select organization"}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-6 items-center justify-center rounded-md bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
                {active?.name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-medium">
                  {active?.name ?? "Select organization"}
                </span>
                <span className="truncate text-xs text-muted-foreground">Organization</span>
              </div>
              <ChevronsUpDown className="ml-auto text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Organizations
            </DropdownMenuLabel>
            {organizations.map((org) => (
              <DropdownMenuItem key={org.id} onClick={() => switchOrg(org.id)} className="gap-2">
                <div className="flex size-5 items-center justify-center rounded bg-muted text-[10px] font-bold">
                  {org.name[0]?.toUpperCase()}
                </div>
                <span className="truncate">{org.name}</span>
                {org.id === active?.id && <Check className="ml-auto size-4" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings/organization")} className="gap-2">
              <div className="flex size-5 items-center justify-center rounded border border-dashed">
                <Plus className="size-3.5" />
              </div>
              <span className="text-muted-foreground">Create organization</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
