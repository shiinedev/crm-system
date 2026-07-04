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
      {/* A11y: lets keyboard/screen-reader users jump past sidebar + header */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header />
        <main id="main" className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}