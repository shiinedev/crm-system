"use client"

import { LogOut, User, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationsBell } from "@/modules/notifications/components/notification-bell"
import { CommandPalette } from "@/modules/search/components/command-palette"
import { useCommandPalette } from "@/hooks/use-command-palette"
import { useSession, signOut } from "@/server/auth/auth-client"
import { useRouter } from "next/navigation"
import { getInitials } from "@/utils/get-initials"

export function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const { setOpen: openPalette } = useCommandPalette()
  const user = session?.user

  async function handleSignOut() {
    await signOut()
    router.push("/login")
  }

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b bg-background px-4">
        {/* Sidebar toggle (org switcher now lives in the sidebar header) */}
        <SidebarTrigger className="-ml-1" />

        {/* Right side */}
        <div className="flex items-center gap-1">
          {/* ⌘K search trigger */}
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex items-center gap-2 text-muted-foreground h-8 px-3 text-xs"
            onClick={() => openPalette(true)}
          >
            <Search className="h-3.5 w-3.5" />
            Search…
            <kbd className="ml-1 text-[10px] border rounded px-1">⌘K</kbd>
          </Button>
          <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => openPalette(true)}>
            <Search className="h-4 w-4" />
          </Button>

          <NotificationsBell />

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
      <CommandPalette />
    </>
  )
}
