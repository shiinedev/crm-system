"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2, Users, TrendingUp, CheckSquare, LayoutDashboard,
  FileText, Zap, BarChart3, Settings, Bot, ChevronRight,
} from "lucide-react"
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarMenuSkeleton, SidebarMenuSub, SidebarMenuSubButton,
  SidebarMenuSubItem, SidebarRail,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { OrgSwitcher, type SwitcherOrg } from "@/components/layout/org-switcher"
import { useRole } from "@/hooks/use-role"

type NavItem = { href: string; label: string; icon: React.ElementType }

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/tasks", label: "Tasks", icon: CheckSquare },
    ],
  },
  {
    label: "CRM",
    items: [
      { href: "/companies", label: "Companies", icon: Building2 },
      { href: "/contacts", label: "Contacts", icon: Users },
      { href: "/deals", label: "Deals", icon: TrendingUp },
      { href: "/documents", label: "Documents", icon: FileText },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/automation", label: "Automation", icon: Zap },
      { href: "/ai", label: "AI Assistant", icon: Bot },
    ],
  },
]

const SETTINGS_SUB = [
  { href: "/settings/organization", label: "Organization" },
  { href: "/settings/members", label: "Members" },
  { href: "/settings/pipelines", label: "Pipelines" },
  { href: "/settings/profile", label: "Profile" },
]

// Shown when the role query is done but returns no role (e.g. no active org yet)
// so the nav never collapses to nothing.
const FALLBACK_HREFS = new Set(["/dashboard", "/tasks", "/settings"])

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/")
}

interface AppSidebarProps {
  organizations: SwitcherOrg[]
  activeOrganizationId: string | null
}

export function AppSidebar({ organizations, activeOrganizationId }: AppSidebarProps) {
  const pathname = usePathname()
  const { visibleNavItems, isLoading, role } = useRole()

  const visible = role ? visibleNavItems : FALLBACK_HREFS

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-6 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                  <TrendingUp />
                </div>
                <span className="font-semibold">CRM</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <OrgSwitcher organizations={organizations} activeOrganizationId={activeOrganizationId} />
      </SidebarHeader>

      <SidebarContent>
        {isLoading ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          NAV_GROUPS.map((group) => {
            const items = group.items.filter((item) => visible.has(item.href))
            if (items.length === 0) return null
            return (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {items.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(pathname, item.href)}
                          tooltip={item.label}
                        >
                          <Link href={item.href}>
                            <item.icon />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )
          })
        )}

        {/* Settings — collapsible sub-menu, available to every role */}
        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible
                asChild
                defaultOpen={pathname.startsWith("/settings")}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Settings"
                      isActive={pathname.startsWith("/settings")}
                    >
                      <Settings />
                      <span>Settings</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {SETTINGS_SUB.map((sub) => (
                        <SidebarMenuSubItem key={sub.href}>
                          <SidebarMenuSubButton asChild isActive={isActive(pathname, sub.href)}>
                            <Link href={sub.href}>{sub.label}</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
