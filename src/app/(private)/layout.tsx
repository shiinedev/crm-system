import { cookies, headers } from "next/headers"
import { getSession } from "@/utils/get-session"
import { auth } from "@/server/auth/auth"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession() // redirects to /login if no session
  const headersList = await headers()

  // Fetch the org list + active org on the server so the switcher renders the
  // current organization immediately — no client fetch, no "Select org" flash.
  const orgsResult = await auth.api.listOrganizations({ headers: headersList }).catch(() => [])
  const organizations = (Array.isArray(orgsResult) ? orgsResult : []).map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug ?? null,
    logo: o.logo ?? null,
  }))
  const activeOrganizationId = session?.session?.activeOrganizationId ?? null

  // Restore the sidebar's collapsed/expanded state from the cookie so it
  // renders consistently on first paint (no flash, no "disappearing" sidebar).
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <SidebarProvider defaultOpen={defaultOpen} className="h-svh overflow-hidden">
      <AppSidebar organizations={organizations} activeOrganizationId={activeOrganizationId} />
      <SidebarInset className="min-w-0 overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
