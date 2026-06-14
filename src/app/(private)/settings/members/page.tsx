"use client"

import { useState, useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { organization, useSession } from "@/server/auth/auth-client"
import { getInitials } from "@/utils/get-initials"
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"

const schema = z.object({
    email: z.string().email("Invalid email"),
    role: z.enum(["admin", "manager", "sales_rep", "support_agent", "viewer"]),
})

type FormValues = z.infer<typeof schema>

const ROLE_COLORS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    owner: "default",
    admin: "secondary",
    manager: "outline",
    sales_rep: "outline",
    support_agent: "outline",
    viewer: "outline",
}

export default function MembersPage() {
    const { data: session } = useSession()
    const [members, setMembers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [orgId, setOrgId] = useState<string | null>(null)

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: "", role: "sales_rep" },
    })

    useEffect(() => {
        loadMembers()
    }, [session])

    async function loadMembers() {
        const activeOrgId = session?.session?.activeOrganizationId
        if (!activeOrgId) return
        setOrgId(activeOrgId)
        const res = await organization.listMembers()
        if (res.data) setMembers((res.data as any).members ?? res.data)
        setLoading(false)
    }

    async function onInvite(values: FormValues) {
        if (!orgId) return
        const { error } = await organization.inviteMember({
            organizationId: orgId,
            email: values.email,
            role: values.role as any,
        })
        if (error) {
            toast.error(error.message ?? "Failed to send invite")
        } else {
            toast.success(`Invitation sent to ${values.email}`)
            form.reset({ email: "", role: "sales_rep" })
        }
    }

    return (
        <div className="max-w-2xl space-y-6">
            {/* Invite */}
            <Card>
                <CardHeader>
                    <CardTitle>Invite member</CardTitle>
                    <CardDescription>Send an invitation to add someone to your organization.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onInvite)} className="flex gap-3 items-end">
                        <FieldGroup>
                            <Controller control={form.control} name="email" render={({ field, fieldState }) => (
                                <Field className="flex-1" data-invalid={fieldState.invalid}>
                                    <FieldLabel>Email address</FieldLabel>
                                    <FieldContent><Input placeholder="colleague@company.com" data-invalid={fieldState.invalid} {...field} /></FieldContent>
                                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )} />
                            <Controller control={form.control} name="role" render={({ field, fieldState }) => (
                                <Field className="flex-1" data-invalid={fieldState.invalid}>
                                    <FieldLabel>Role</FieldLabel>
                                    <Select value={field.value} onValueChange={field.onChange} disabled={loading}>
                                        <FieldContent><SelectTrigger className="w-full" data-invalid={fieldState.invalid}><SelectValue /></SelectTrigger></FieldContent>
                                        <SelectContent>
                                            {["admin", "manager", "sales_rep", "support_agent", "viewer"].map((r) => (
                                                <SelectItem key={r} value={r} className="capitalize">{r.replace("_", " ")}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )} />
                            <Button type="submit" className="shrink-0">Send invite</Button>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>

            {/* Members list */}
            <Card>
                <CardHeader>
                    <CardTitle>Members</CardTitle>
                    <CardDescription>People with access to your organization.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-6 space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <div className="space-y-1.5 flex-1">
                                        <Skeleton className="h-3.5 w-32" />
                                        <Skeleton className="h-3 w-48" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div>
                            {members.map((member, idx) => (
                                <div key={member.id}>
                                    <div className="flex items-center gap-3 px-6 py-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="text-xs">
                                                {getInitials(member.user?.name ?? "?")}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{member.user?.name ?? "Unknown"}</p>
                                            <p className="text-xs text-muted-foreground truncate">{member.user?.email}</p>
                                        </div>
                                        <Badge variant={ROLE_COLORS[member.role] ?? "outline"} className="capitalize shrink-0">
                                            {member.role.replace("_", " ")}
                                        </Badge>
                                    </div>
                                    {idx < members.length - 1 && <Separator />}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}