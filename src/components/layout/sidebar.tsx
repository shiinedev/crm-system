"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2, Users, TrendingUp, CheckSquare, LayoutDashboard,
  FileText, Zap, BarChart3, Settings, Bot,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const NAV_ITEMS = [
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
}

function SidebarLink({ href, label, icon: Icon, active }: SidebarLinkProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
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

export function Sidebar() {
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="flex h-full w-60 shrink-0 flex-col border-r bg-sidebar">
        {/* Logo */}
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sidebar-primary">
              <TrendingUp className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground">CRM</span>
          </Link>
        </div>

        {/* Main nav */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => (
            <SidebarLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={pathname === item.href || pathname.startsWith(item.href + "/")}
            />
          ))}
        </nav>

        {/* Bottom nav */}
        <div className="border-t p-3 space-y-1">
          {BOTTOM_ITEMS.map((item) => (
            <SidebarLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={pathname.startsWith(item.href)}
            />
          ))}
        </div>
      </aside>
    </TooltipProvider>
  )
}