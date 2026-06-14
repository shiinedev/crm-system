"use client"

import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"

import {
    Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel
} from "@/components/ui/field"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCreateContact, useUpdateContact } from "../hooks/use-contact-mutations"
import type { Contact } from "@/db/schema"
import { Loader2 } from "lucide-react"

const schema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
    title: z.string().optional(),
    department: z.string().optional(),
    linkedinUrl: z.string().optional(),
    source: z.enum(["website", "referral", "cold_outreach", "event", "social_media", "paid_ads", "other"]).optional(),
    status: z.enum(["active", "inactive", "bounced"]).optional(),
    notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface ContactFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    contact?: Contact
    companyId?: string
}

export function ContactFormDialog({ open, onOpenChange, contact, companyId }: ContactFormDialogProps) {
    const isEdit = !!contact
    const { execute: createContact, isPending: isCreating } = useCreateContact()
    const { execute: updateContact, isPending: isUpdating } = useUpdateContact()
    const isPending = isCreating || isUpdating

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { firstName: "", lastName: "", email: "", phone: "", title: "", department: "", notes: "" },
    })

    useEffect(() => {
        if (open) {
            form.reset(contact ? {
                firstName: contact.firstName, lastName: contact.lastName,
                email: contact.email ?? "", phone: contact.phone ?? "",
                title: contact.title ?? "", department: contact.department ?? "",
                linkedinUrl: contact.linkedinUrl ?? "",
                source: contact.source ?? undefined, status: contact.status ?? undefined,
                notes: contact.notes ?? "",
            } : { firstName: "", lastName: "", email: "", phone: "", title: "", department: "", notes: "" })
        }
    }, [open, contact])

    function onSubmit(values: FormValues) {
        if (isEdit) {
            updateContact({ id: contact.id, ...values })
        } else {
            createContact({ ...values, companyId })
        }
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit contact" : "Add contact"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FieldGroup className="grid grid-cols-2 gap-3">
                        <Controller control={form.control} name="firstName" render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.error}>
                                <FieldLabel>First name *</FieldLabel>
                                <FieldContent><Input placeholder="Jane" {...field} /></FieldContent>
                                {fieldState.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )} />
                        <Controller control={form.control} name="lastName" render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.error}>
                                <FieldLabel>Last name *</FieldLabel>
                                <FieldContent><Input placeholder="Smith" {...field} /></FieldContent>
                                {fieldState.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )} />
                        <Controller control={form.control} name="email" render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.error}>
                                <FieldLabel>Email</FieldLabel>
                                <FieldContent><Input type="email" placeholder="jane@company.com" {...field} /></FieldContent>
                                {fieldState.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )} />
                        <Controller control={form.control} name="phone" render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.error}>
                                <FieldLabel>Phone</FieldLabel>
                                <FieldContent><Input placeholder="+1 555 000 0000" {...field} /></FieldContent>
                                {fieldState.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )} />
                        <Controller control={form.control} name="title" render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.error}>
                                <FieldLabel>Job title</FieldLabel>
                                <FieldContent><Input placeholder="VP of Sales" {...field} /></FieldContent>
                                {fieldState.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )} />
                        <Controller control={form.control} name="department" render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.error}>
                                <FieldLabel>Department</FieldLabel>
                                <FieldContent><Input placeholder="Sales" {...field} /></FieldContent>
                                {fieldState.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )} />
                        <Controller control={form.control} name="source" render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.error}>
                                <FieldLabel>Source</FieldLabel>
                                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                                    <FieldContent>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select source" />
                                        </SelectTrigger>
                                    </FieldContent>
                                    <SelectContent>
                                        {["website", "referral", "cold_outreach", "event", "social_media", "paid_ads", "other"].map((s) => (
                                            <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {fieldState.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )} />
                        <Controller control={form.control} name="status" render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.error}>
                                <FieldLabel>Status</FieldLabel>
                                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                                    <FieldContent>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger></FieldContent>
                                    <SelectContent>
                                        {["active", "inactive", "bounced"].map((s) => (
                                            <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {fieldState.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )} />
                        <Controller control={form.control} name="notes" render={({ field, fieldState }) => (
                            <Field className="col-span-2" data-invalid={fieldState.error}>
                                <FieldLabel>Notes</FieldLabel>
                                <FieldContent>
                                    <Textarea placeholder="Any additional notes..." {...field} data-invalid={fieldState.error} />
                                </FieldContent>
                                {fieldState.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )} />
                    </FieldGroup>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Save changes" : "Add contact"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}