import type { Metadata } from "next"

// SEO: auth pages carry no search value — keep them out of the index.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      {children}
    </div>
  )
}