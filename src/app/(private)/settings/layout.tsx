import { getSession } from "@/utils/get-session"

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await getSession()

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your organization and account</p>
      </div>
      {/* Navigation is handled by the collapsible Settings menu in the sidebar. */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
    </div>
  )
}
