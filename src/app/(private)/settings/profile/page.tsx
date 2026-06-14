"use client"

import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useSession, authClient } from "@/server/auth/auth-client"
import { getInitials } from "@/utils/get-initials"
import { Field, FieldContent, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field"
import { Loader2 } from "lucide-react"

const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
})

const passwordSchema = z.object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

type ProfileValues = z.infer<typeof profileSchema>
type PasswordValues = z.infer<typeof passwordSchema>

export default function ProfilePage() {
    const { data: session } = useSession()
    const router = useRouter()
    const user = session?.user

    const profileForm = useForm<ProfileValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: { name: "" },
    })

    const passwordForm = useForm<PasswordValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    })

    useEffect(() => {
        if (user) profileForm.reset({ name: user.name ?? "" })
    }, [user])

    async function onProfileSubmit(values: ProfileValues) {
        const { error } = await authClient.updateUser({ name: values.name })
        if (error) {
            toast.error(error.message ?? "Failed to update profile")
        } else {
            toast.success("Profile updated")
            router.refresh()
        }
    }

    async function onPasswordSubmit(values: PasswordValues) {
        const { error } = await authClient.changePassword({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
        })
        if (error) {
            toast.error(error.message ?? "Failed to change password")
        } else {
            toast.success("Password changed")
            passwordForm.reset()
        }
    }

    const isProfileDirty = profileForm.formState.isDirty
    const isPasswordDirty = passwordForm.formState.isDirty
    const isProfileLoading = profileForm.formState.isSubmitting
    const isPasswordLoading = passwordForm.formState.isSubmitting

    return (
        <div className="max-w-lg space-y-6">
            {/* Avatar + name */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>Update your personal information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={user?.image ?? undefined} />
                            <AvatarFallback className="text-lg">
                                {user?.name ? getInitials(user.name) : "??"}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{user?.name}</p>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                    </div>
                    <Separator />
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                        <FieldGroup>
                            <Controller control={profileForm.control} name="name" render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>Display name</FieldLabel>
                                    <FieldContent><Input placeholder="Jane Smith" data-invalid={fieldState.invalid} {...field} /></FieldContent>
                                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )} />
                            <Button type="submit" disabled={!isProfileDirty || isProfileLoading}>
                                {isProfileLoading ? <Loader2 className="animate-spin" /> : "Save changes"}
                            </Button>
                        </ FieldGroup>
                    </form>

                </CardContent>
            </Card>

            {/* Password */}
            <Card>
                <CardHeader>
                    <CardTitle>Change password</CardTitle>
                    <CardDescription>Update your account password.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                        <FieldGroup>
                            <Controller control={passwordForm.control} name="currentPassword" render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>Current password</FieldLabel>
                                    <FieldContent><Input type="password" placeholder="••••••••" data-invalid={fieldState.invalid} {...field} /></FieldContent>
                                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )} />
                            <Controller control={passwordForm.control} name="newPassword" render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>New password</FieldLabel>
                                    <FieldContent><Input type="password" placeholder="••••••••" data-invalid={fieldState.invalid} {...field} /></FieldContent>
                                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )} />
                            <Controller control={passwordForm.control} name="confirmPassword" render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>Confirm new password</FieldLabel>
                                    <FieldContent><Input type="password" placeholder="••••••••" data-invalid={fieldState.invalid} {...field} /></FieldContent>
                                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )} />
                            <Button type="submit" disabled={!isPasswordDirty || isPasswordLoading}>
                                {isPasswordLoading ? <Loader2 className="animate-spin" /> : "Change password"}
                            </Button>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div >
    )
}