"use client"

import { ChevronsUpDown, LogOut, User, Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// import { NotificationsBell } from "@/modules/notifications/components/notifications-bell"
import { useSession, signOut, organization } from "@/server/auth/auth-client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getInitials } from "@/utils/get-initials"

export function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string; slug: string | null }>>([])
  const [activeOrg, setActiveOrg] = useState<string | null>(null)

  useEffect(() => {
    organization.list().then((res) => {
      if (res.data) setOrgs(res.data)
    })
    setActiveOrg(session?.session?.activeOrganizationId ?? null)
  }, [session])

  async function handleSwitchOrg(orgId: string) {
    await organization.setActive({ organizationId: orgId })
    setActiveOrg(orgId)
    router.refresh()
  }

  async function handleSignOut() {
    await signOut()
    router.push("/login")
  }

  const currentOrg = orgs.find((o) => o.id === activeOrg)
  const user = session?.user

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      {/* Org Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 font-medium">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
              {currentOrg?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <span className="max-w-[120px] truncate">{currentOrg?.name ?? "Select org"}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {orgs.map((org) => (
            <DropdownMenuItem key={org.id} onClick={() => handleSwitchOrg(org.id)}>
              <div className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px] font-bold">
                {org.name[0].toUpperCase()}
              </div>
              <span className="truncate">{org.name}</span>
              {org.id === activeOrg && <Check className="ml-auto h-3.5 w-3.5" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/settings/organization")}>
            <Plus className="h-4 w-4" />
            Create organization
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Right side */}
      <div className="flex items-center gap-1">
        {/* <NotificationsBell /> */}

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.image ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {user?.name ? getInitials(user.name) : "??"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-foreground">{user?.name}</span>
                <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings/profile")}>
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}