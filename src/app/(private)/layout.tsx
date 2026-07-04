import type { Metadata } from "next"
import { getSession } from "@/utils/get-session"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

// SEO: the app is session-gated tenant data — never index it.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await getSession() // redirects to /login if no session

  return (
     <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}