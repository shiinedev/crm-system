"use client"

import { useCallback, useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { MoreHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { organization, useSession } from "@/server/auth/auth-client"
import { useRole } from "@/hooks/use-role"
import { getInitials } from "@/utils/get-initials"
import { ASSIGNABLE_ROLES, ROLE_LABELS, type OrgRole } from "@/lib/permissions"

const schema = z.object({
    email: z.email("Invalid email"),
    role: z.enum(["admin", "manager", "sales_rep", "support_agent", "viewer"]),
})

type FormValues = z.infer<typeof schema>

type MemberRow = {
    id: string
    role: string
    userId?: string
    user?: { name?: string | null; email?: string | null }
}

type InvitationRow = {
    id: string
    email: string
    role: string
    status: string
    expiresAt?: string | Date
}

const ROLE_COLORS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    owner: "default",
    admin: "secondary",
    manager: "outline",
    sales_rep: "outline",
    support_agent: "outline",
    viewer: "outline",
}

function roleLabel(role: string) {
    return ROLE_LABELS[role as OrgRole] ?? role.replace("_", " ")
}

export default function MembersPage() {
    const { data: session } = useSession()
    const { canAdmin } = useRole()
    const [members, setMembers] = useState<MemberRow[]>([])
    const [invitations, setInvitations] = useState<InvitationRow[]>([])
    const [loading, setLoading] = useState(true)
    const [removeTarget, setRemoveTarget] = useState<MemberRow | null>(null)
    const orgId = session?.session?.activeOrganizationId ?? null
    const currentUserId = session?.user?.id ?? null

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: "", role: "sales_rep" },
    })

    const loadData = useCallback(async () => {
        if (!orgId) return
        const [membersRes, invitesRes] = await Promise.all([
            organization.listMembers(),
            organization.listInvitations(),
        ])
        if (membersRes.data) {
            const data = membersRes.data as { members?: MemberRow[] } | MemberRow[]
            setMembers(Array.isArray(data) ? data : (data.members ?? []))
        }
        if (invitesRes.data) {
            const list = invitesRes.data as InvitationRow[]
            setInvitations(list.filter((i) => i.status === "pending"))
        }
        setLoading(false)
    }, [orgId])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch on mount/session change
        loadData()
    }, [loadData])

    async function onInvite(values: FormValues) {
        if (!orgId) return
        const { error } = await organization.inviteMember({
            organizationId: orgId,
            email: values.email,
            role: values.role as Parameters<typeof organization.inviteMember>[0]["role"],
        })
        if (error) {
            toast.error(error.message ?? "Failed to send invite")
        } else {
            toast.success(`Invitation sent to ${values.email}`)
            form.reset({ email: "", role: "sales_rep" })
            loadData()
        }
    }

    async function onChangeRole(member: MemberRow, role: string) {
        const { error } = await organization.updateMemberRole({
            memberId: member.id,
            role: role as Parameters<typeof organization.updateMemberRole>[0]["role"],
        })
        if (error) {
            toast.error(error.message ?? "Failed to update role")
        } else {
            toast.success(`${member.user?.name ?? "Member"} is now ${roleLabel(role)}`)
            loadData()
        }
    }

    async function onRemove(member: MemberRow) {
        const { error } = await organization.removeMember({ memberIdOrEmail: member.id })
        if (error) {
            toast.error(error.message ?? "Failed to remove member")
        } else {
            toast.success(`${member.user?.name ?? "Member"} removed`)
            loadData()
        }
        setRemoveTarget(null)
    }

    async function onCancelInvite(invitation: InvitationRow) {
        const { error } = await organization.cancelInvitation({ invitationId: invitation.id })
        if (error) {
            toast.error(error.message ?? "Failed to cancel invitation")
        } else {
            toast.success(`Invitation to ${invitation.email} cancelled`)
            loadData()
        }
    }

    return (
        <div className="max-w-2xl space-y-6">
            {/* Invite — admins & owners only */}
            {canAdmin && (
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
                                                {ASSIGNABLE_ROLES.map((r) => (
                                                    <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>
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
            )}

            {/* Pending invitations — admins & owners only */}
            {canAdmin && invitations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Pending invitations</CardTitle>
                        <CardDescription>People who&apos;ve been invited but haven&apos;t joined yet.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {invitations.map((invite, idx) => (
                            <div key={invite.id}>
                                <div className="flex items-center gap-3 px-6 py-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{invite.email}</p>
                                        <p className="text-xs text-muted-foreground">Invited as {roleLabel(invite.role)}</p>
                                    </div>
                                    <Badge variant="outline" className="shrink-0">Pending</Badge>
                                    <Button
                                        variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                                        onClick={() => onCancelInvite(invite)}
                                        aria-label={`Cancel invitation to ${invite.email}`}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                {idx < invitations.length - 1 && <Separator />}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

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
                            {members.map((member, idx) => {
                                const isSelf = member.userId === currentUserId
                                const isOwner = member.role === "owner"
                                // Admins can manage everyone except owners and themselves.
                                const canManageRow = canAdmin && !isOwner && !isSelf
                                return (
                                    <div key={member.id}>
                                        <div className="flex items-center gap-3 px-6 py-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="text-xs">
                                                    {getInitials(member.user?.name ?? "?")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {member.user?.name ?? "Unknown"}
                                                    {isSelf && <span className="text-muted-foreground font-normal"> (you)</span>}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">{member.user?.email}</p>
                                            </div>

                                            {canManageRow ? (
                                                <>
                                                    <Select value={member.role} onValueChange={(role) => onChangeRole(member, role)}>
                                                        <SelectTrigger size="sm" className="w-[140px] shrink-0">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {ASSIGNABLE_ROLES.map((r) => (
                                                                <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Member actions">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={() => setRemoveTarget(member)}
                                                            >
                                                                Remove from organization
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </>
                                            ) : (
                                                <Badge variant={ROLE_COLORS[member.role] ?? "outline"} className="shrink-0">
                                                    {roleLabel(member.role)}
                                                </Badge>
                                            )}
                                        </div>
                                        {idx < members.length - 1 && <Separator />}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Remove confirmation */}
            <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove member?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {removeTarget?.user?.name ?? "This member"} will lose access to this organization.
                            This can&apos;t be undone, but you can re-invite them later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={() => removeTarget && onRemove(removeTarget)}
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
