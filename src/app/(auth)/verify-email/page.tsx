"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, MailCheck, TrendingUp, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { sendVerificationEmail } from "@/server/auth/auth-client"
import { toast } from "sonner"

const ERROR_MESSAGES: Record<string, string> = {
  invalid_token: "This verification link is invalid.",
  token_expired: "This verification link has expired.",
  user_not_found: "We couldn't find an account for this link.",
}

function ResendButton({ email }: { email: string }) {
  const [isPending, setIsPending] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleResend() {
    setIsPending(true)
    const { error } = await sendVerificationEmail({ email, callbackURL: "/verify-email" })
    setIsPending(false)
    if (error) {
      toast.error(error.message ?? "Failed to resend verification email")
    } else {
      setSent(true)
      toast.success("Verification email sent")
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={handleResend} disabled={isPending || sent}>
      {sent ? "Email sent" : isPending ? "Sending..." : "Resend verification email"}
    </Button>
  )
}

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const pending = searchParams.get("pending")
  const email = searchParams.get("email") ?? ""

  let title: string
  let description: string

  if (error) {
    title = "Verification failed"
    description = ERROR_MESSAGES[error] ?? "Something went wrong verifying your email."
  } else if (pending) {
    title = "Check your inbox"
    description = "We sent you a verification link. Click it to activate your account."
  } else {
    title = "Email verified!"
    description = "Your email address has been confirmed."
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>
        <div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 pb-8">
        {error ? (
          <>
            <XCircle className="h-8 w-8 text-destructive" />
            {email ? (
              <ResendButton email={email} />
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Sign in to request a new verification link.
              </p>
            )}
            <Link href="/login" className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              Back to sign in
            </Link>
          </>
        ) : pending ? (
          <>
            <MailCheck className="h-8 w-8 text-primary" />
            <p className="text-center text-xs text-muted-foreground">
              Didn&apos;t get it? Check your spam folder{email ? ", or resend it below" : ""}.
            </p>
            {email && <ResendButton email={email} />}
            <Link href="/login" className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <Button size="sm" asChild>
              <Link href="/dashboard">Continue to dashboard</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
