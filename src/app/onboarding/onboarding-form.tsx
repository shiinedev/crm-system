"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { TrendingUp, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { organization } from "@/server/auth/auth-client"

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
})

type FormValues = z.infer<typeof schema>

interface OnboardingFormProps {
  userName: string | null
  hasExistingOrg: boolean
}

export function OnboardingForm({ userName, hasExistingOrg }: OnboardingFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [slugEdited, setSlugEdited] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", slug: "" },
  })

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    const { data, error } = await organization.create({ name: values.name, slug: values.slug })
    if (error || !data) {
      setSubmitting(false)
      toast.error(error?.message ?? "Failed to create organization")
      return
    }
    await organization.setActive({ organizationId: data.id })
    toast.success(`${data.name} is ready`)
    router.push("/dashboard")
    router.refresh()
  }

  const firstName = userName?.split(" ")[0]

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="items-center text-center">
        <div className="mb-1 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <TrendingUp className="size-5" />
        </div>
        <CardTitle className="text-xl">
          {hasExistingOrg
            ? "Create a new organization"
            : `Welcome${firstName ? `, ${firstName}` : ""}!`}
        </CardTitle>
        <CardDescription>
          {hasExistingOrg
            ? "Set up another workspace for your team."
            : "Let's create your organization to get started."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Organization name</FieldLabel>
                  <FieldContent>
                    <Input
                      placeholder="Acme Inc."
                      autoFocus
                      data-invalid={fieldState.invalid}
                      {...field}
                      onChange={(e) => {
                        field.onChange(e)
                        if (!slugEdited) {
                          form.setValue("slug", slugify(e.target.value), { shouldValidate: true })
                        }
                      }}
                    />
                  </FieldContent>
                  {fieldState.error && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="slug"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>URL slug</FieldLabel>
                  <FieldContent>
                    <Input
                      placeholder="acme-inc"
                      data-invalid={fieldState.invalid}
                      {...field}
                      onChange={(e) => {
                        setSlugEdited(true)
                        field.onChange(e)
                      }}
                    />
                  </FieldContent>
                  <FieldDescription>
                    Used in your organization URL. Lowercase letters, numbers, and hyphens.
                  </FieldDescription>
                  {fieldState.error && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Spinner />}
              Create organization
            </Button>

            {hasExistingOrg && (
              <Button variant="ghost" size="sm" asChild className="w-full">
                <Link href="/dashboard">
                  <ArrowLeft className="size-4" />
                  Back to dashboard
                </Link>
              </Button>
            )}
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
