"use client"

import { use, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { organization } from "@/server/auth/auth-client"

export default function AcceptInvitationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [status, setStatus] = useState<"pending" | "accepted" | "error">("pending")
  const [message, setMessage] = useState<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    // Run exactly once. We deliberately do NOT gate the result on an
    // "active"/cancelled flag: under React StrictMode the effect mounts →
    // cleans up → mounts again, and combined with the `started` ref a
    // cancel-on-cleanup flag would discard the in-flight response and leave the
    // page stuck on "Accepting your invitation…". The ref alone dedupes the call.
    if (started.current) return
    started.current = true

    let redirectTimer: ReturnType<typeof setTimeout> | undefined
    organization
      .acceptInvitation({ invitationId: id })
      .then(({ error }) => {
        if (error) {
          setStatus("error")
          setMessage(error.message ?? "This invitation is invalid or has expired.")
        } else {
          setStatus("accepted")
          redirectTimer = setTimeout(() => router.push("/dashboard"), 1500)
        }
      })
      .catch(() => {
        setStatus("error")
        setMessage("This invitation is invalid or has expired.")
      })

    return () => clearTimeout(redirectTimer)
  }, [id, router])

  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Organization invitation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 pb-8 text-center">
          {status === "pending" && (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Accepting your invitation…</p>
            </>
          )}
          {status === "accepted" && (
            <>
              <CheckCircle2 className="h-8 w-8 text-primary" />
              <p className="text-sm text-muted-foreground">
                You&apos;re in! Redirecting to your dashboard…
              </p>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">{message}</p>
              <Button size="sm" variant="outline" asChild>
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
