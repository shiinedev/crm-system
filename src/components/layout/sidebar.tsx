"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2, Users, TrendingUp, CheckSquare, LayoutDashboard,
  FileText, Zap, BarChart3, Settings, Bot, Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRole } from "@/hooks/use-role"

const ALL_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/deals", label: "Deals", icon: TrendingUp },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/automation", label: "Automation", icon: Zap },
  { href: "/ai", label: "AI Assistant", icon: Bot },
]

const BOTTOM_ITEMS = [
  { href: "/settings", label: "Settings", icon: Settings },
]

interface SidebarLinkProps {
  href: string
  label: string
  icon: React.ElementType
  active: boolean
  onClick?: () => void
}

function SidebarLink({ href, label, icon: Icon, active, onClick }: SidebarLinkProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          onClick={onClick}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
            active
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span>{label}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" className="hidden">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

interface SidebarContentProps {
  pathname: string
  visibleHrefs: Set<string>
  onNavigate?: () => void
}

function SidebarContent({ pathname, visibleHrefs, onNavigate }: SidebarContentProps) {
  const navItems = ALL_NAV_ITEMS.filter((item) => visibleHrefs.has(item.href))

  return (
    <div className="flex h-full w-full flex-col bg-sidebar">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={onNavigate}>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sidebar-primary">
            <TrendingUp className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <span className="font-semibold text-sidebar-foreground">CRM</span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {navItems.map((item) => (
          <SidebarLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={pathname === item.href || pathname.startsWith(item.href + "/")}
            onClick={onNavigate}
          />
        ))}
      </nav>

      <div className="border-t p-3 space-y-1">
        {BOTTOM_ITEMS.map((item) => (
          <SidebarLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={pathname.startsWith(item.href)}
            onClick={onNavigate}
          />
        ))}
      </div>
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { visibleNavItems, isLoading } = useRole()

  // Show all items while role is loading to avoid layout shift
  const visibleHrefs = isLoading
    ? new Set(ALL_NAV_ITEMS.map((i) => i.href).concat(["/settings"]))
    : visibleNavItems

  return (
    <TooltipProvider delayDuration={0}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex h-full w-60 shrink-0 flex-col border-r">
        <SidebarContent pathname={pathname} visibleHrefs={visibleHrefs} />
      </aside>

      {/* Mobile hamburger + Sheet */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-3 left-3 z-40 h-8 w-8"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-4 w-4" />
        </Button>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-60">
            <SidebarContent
              pathname={pathname}
              visibleHrefs={visibleHrefs}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  )
}