import Link from "next/link"
import { getSession } from "@/utils/get-session"


const SETTINGS_NAV = [
  { href: "/settings/organization", label: "Organization" },
  { href: "/settings/members", label: "Members" },
  { href: "/settings/pipelines", label: "Pipelines" },
  { href: "/settings/profile", label: "Profile" },
]

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await getSession()

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your organization and account</p>
      </div>
      <div className="flex flex-1 overflow-hidden">
        {/* Settings nav */}
        <aside className="w-52 shrink-0 border-r p-4 space-y-1">
          {SETTINGS_NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {label}
            </Link>
          ))}
        </aside>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}