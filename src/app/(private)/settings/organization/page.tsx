"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field,FieldContent,FieldDescription,FieldError,FieldLabel, } from "@/components/ui/field"
import { organization } from "@/server/auth/auth-client"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
})

type FormValues = z.infer<typeof schema>

export default function OrganizationSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", slug: "" },
  })

  useEffect(() => {
    organization.list().then((res) => {
      const orgs = res.data
      if (orgs && orgs.length > 0) {
        const org = orgs[0]
        setOrgId(org.id)
        form.reset({ name: org.name, slug: org.slug ?? "" })
      }
      setLoading(false)
    })
  }, [])

  async function onSubmit(values: FormValues) {
    if (!orgId) return
    const { error } = await organization.update({
      organizationId: orgId,
      data: { name: values.name, slug: values.slug },
    })
    if (error) {
      toast.error(error.message ?? "Failed to update organization")
    } else {
      toast.success("Organization updated")
      router.refresh()
    }
  }

  async function handleCreate(values: FormValues) {
    const { error } = await organization.create({ name: values.name, slug: values.slug })
    if (error) {
      toast.error(error.message ?? "Failed to create organization")
    } else {
      toast.success("Organization created")
      router.refresh()
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization details</CardTitle>
          <CardDescription>Update your organization name and URL slug.</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={form.handleSubmit(orgId ? onSubmit : handleCreate)} className="space-y-4">
                <FieldGroup>
              <Controller
              control={form.control} 
              name="name" 
              render={({ field,fieldState }) => (
                <Field data-invalid={fieldState.error}>
                  <FieldLabel>Organization name</FieldLabel>
                  <FieldContent><Input placeholder="Acme Inc." {...field} data-invalid={fieldState.error} /></FieldContent>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )} />

              <Controller control={form.control} name="slug" render={({ field,fieldState }) => (
                <Field data-invalid={fieldState.error}>
                  <FieldLabel>URL slug</FieldLabel>
                  <FieldContent><Input placeholder="acme-inc" {...field} data-invalid={fieldState.error} /></FieldContent>
                  <FieldDescription>Used in your organization URL. Lowercase letters, numbers, hyphens only.</FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )} />
              <Button type="submit">
                {orgId ? "Save changes" : "Create organization"}
              </Button>
                </FieldGroup>
            </form>
        </CardContent>
      </Card>
    </div>
  )
}