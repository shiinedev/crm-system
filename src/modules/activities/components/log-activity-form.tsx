"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useCreateActivity } from "../hooks/use-activity-mutations"
import { Field, FieldGroup, FieldContent, FieldError } from "@/components/ui/field"

const ACTIVITY_TYPES = [
    { value: "note", label: "Note" },
    { value: "call", label: "Call" },
    { value: "email", label: "Email" },
    { value: "meeting", label: "Meeting" },
] as const

const schema = z.object({
    type: z.enum(["call", "meeting", "email", "note", "task", "status_change", "document_upload", "comment"]),
    title: z.string().min(1, "Title is required"),
    body: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface LogActivityFormProps {
    dealId?: string
    companyId?: string
    contactId?: string
    onSuccess?: () => void
}

export function LogActivityForm({ dealId, companyId, contactId, onSuccess }: LogActivityFormProps) {
    const { execute: createActivity, isPending } = useCreateActivity()

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { type: "note", title: "", body: "" },
    })

    function onSubmit(values: FormValues) {
        createActivity({ ...values, dealId, companyId, contactId })
        form.reset({ type: "note", title: "", body: "" })
        onSuccess?.()
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FieldGroup className="flex gap-2">
                <Controller control={form.control} name="type" render={({ field, fieldState }) => (
                    <Field className="w-36 shrink-0">
                        <Select value={field.value} onValueChange={field.onChange} data-invalid={fieldState.invalid}>
                            <FieldContent><SelectTrigger className="h-8 text-sm" data-invalid={fieldState.invalid}><SelectValue /></SelectTrigger></FieldContent>
                            <SelectContent>
                                {ACTIVITY_TYPES.map(({ value, label }) => (
                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </Field>
                )} />
                <Controller control={form.control} name="title" render={({ field, fieldState }) => (
                    <Field className="flex-1" data-invalid={fieldState.invalid}>
                        <FieldContent>
                            <Input className="h-8 text-sm" data-invalid={fieldState.invalid} placeholder="Title or subject..." {...field} />
                        </FieldContent>
                        {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </Field>
                )} />
            </FieldGroup>
            <Controller control={form.control} name="body" render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                        <Textarea
                            data-invalid={fieldState.invalid}
                            rows={3}
                            placeholder="Add details, mentions (@name), or notes..."
                            className="text-sm resize-none"
                            {...field}
                        />
                    </FieldContent>
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                </Field>
            )} />
            <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={isPending}>
                    {isPending ? "Saving..." : "Log activity"}
                </Button>
            </div>
        </form>
    )
}