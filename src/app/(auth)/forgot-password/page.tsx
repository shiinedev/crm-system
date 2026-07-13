"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { MailCheck, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { requestPasswordReset } from "@/server/auth/auth-client"
import { toast } from "sonner"

const schema = z.object({
  email: z.email("Invalid email"),
})

type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [isPending, setIsPending] = useState(false)
  const [sent, setSent] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  })

  async function onSubmit(values: FormValues) {
    setIsPending(true)
    const { error } = await requestPasswordReset({
      email: values.email,
      redirectTo: "/reset-password",
    })
    setIsPending(false)
    if (error) {
      toast.error(error.message ?? "Failed to send reset email")
    } else {
      // Same message whether or not the account exists — no user enumeration
      setSent(true)
    }
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
          <CardTitle className="text-xl">Forgot your password?</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send you a reset link
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <MailCheck className="h-8 w-8 text-primary" />
            <p className="text-sm text-muted-foreground">
              If an account exists for that email, a reset link is on its way.
              Check your inbox (and spam folder).
            </p>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@company.com" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Remembered it?{" "}
          <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
