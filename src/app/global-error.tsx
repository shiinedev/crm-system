"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global error:", error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center p-6 font-sans">
          <h2 className="text-base font-semibold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            A critical error occurred. Refreshing usually fixes this.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono">Error ID: {error.digest}</p>
          )}
          <Button size="sm" onClick={reset}>Try again</Button>
        </div>
      </body>
    </html>
  )
}