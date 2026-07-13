"use client"

import { Suspense, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { resetPassword } from "@/server/auth/auth-client"
import { toast } from "sonner"

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type FormValues = z.infer<typeof schema>

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [isPending, setIsPending] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  async function onSubmit(values: FormValues) {
    if (!token) {
      toast.error("Invalid or missing reset token. Request a new link.")
      return
    }
    setIsPending(true)
    const { error } = await resetPassword({
      newPassword: values.password,
      token,
    })
    setIsPending(false)
    if (error) {
      toast.error(error.message ?? "Failed to reset password. The link may have expired.")
    } else {
      toast.success("Password updated! Sign in with your new password.")
      router.push("/login")
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
          <CardTitle className="text-xl">Choose a new password</CardTitle>
          <CardDescription>Enter and confirm your new password</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!token ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            This reset link is invalid or incomplete.{" "}
            <Link href="/forgot-password" className="text-foreground underline-offset-4 hover:underline">
              Request a new one
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" placeholder="••••••••" {...form.register("password")} />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" type="password" placeholder="••••••••" {...form.register("confirmPassword")} />
              {form.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Updating..." : "Update password"}
            </Button>
          </form>
        )}

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
