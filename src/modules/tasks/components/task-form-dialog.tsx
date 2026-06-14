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
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCreateTask, useUpdateTask } from "../hooks/use-task-mutations"
import type { Task } from "@/db/schema"
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { useTRPC } from "@/lib/trpc/client"

const schema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    dueDate: z.string().optional(),
    status: z.enum(["todo", "in_progress", "done", "cancelled"]).optional(),
})

type FormValues = z.infer<typeof schema>

interface TaskFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    task?: Task
    dealId?: string
    companyId?: string
    contactId?: string
}

export function TaskFormDialog({ open, onOpenChange, task, dealId, companyId, contactId }: TaskFormDialogProps) {
    const isEdit = !!task
    const { execute: createTask, isPending: isCreating } = useCreateTask()
    const { execute: updateTask, isPending: isUpdating } = useUpdateTask()
    const isPending = isCreating || isUpdating

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { title: "", description: "", priority: "medium", status: "todo" },
    })

    useEffect(() => {
        if (open) {
            form.reset(task ? {
                title: task.title, description: task.description ?? "",
                priority: task.priority ?? "medium",
                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
                status: task.status ?? "todo",
            } : { title: "", description: "", priority: "medium", status: "todo" })
        }
    }, [open, task])

    function onSubmit(values: FormValues) {
        const dueDate = values.dueDate ? new Date(values.dueDate).toISOString() : undefined
        if (isEdit) {
            updateTask({ id: task.id, ...values, dueDate })
        } else {
            createTask({ ...values, dueDate, dealId, companyId, contactId })
        }
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit task" : "New task"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FieldGroup>
                        <Controller control={form.control} name="title" render={({ field, fieldState }) => (
                            <Field>
                                <FieldLabel>Title *</FieldLabel>
                                <FieldContent><Input placeholder="Follow up with client" {...field} /></FieldContent>
                                {fieldState.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )} />
                        <Controller control={form.control} name="description" render={({ field, fieldState }) => (
                            <Field>
                                <FieldLabel>Description</FieldLabel>
                                <FieldContent><Textarea placeholder="Optional details..." rows={2} {...field} /></FieldContent>
                                {fieldState.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )} />
                        <div className="grid grid-cols-2 gap-3">
                            <Controller control={form.control} name="priority" render={({ field, fieldState }) => (
                                <Field>
                                    <FieldLabel>Priority</FieldLabel>
                                    <Select value={field.value ?? "medium"} onValueChange={field.onChange}>
                                        <FieldContent><SelectTrigger><SelectValue /></SelectTrigger></FieldContent>
                                        <SelectContent>
                                            {["low", "medium", "high", "urgent"].map((p) => (
                                                <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )} />
                            <Controller control={form.control} name="dueDate" render={({ field, fieldState }) => (
                                <Field>
                                    <FieldLabel>Due date</FieldLabel>
                                    <FieldContent><Input type="date" {...field} /></FieldContent>
                                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )} />
                            {isEdit && (
                                <Controller control={form.control} name="status" render={({ field, fieldState }) => (
                                    <Field className="col-span-2">
                                        <FieldLabel>Status</FieldLabel>
                                        <Select value={field.value ?? "todo"} onValueChange={field.onChange}>
                                            <FieldContent><SelectTrigger><SelectValue /></SelectTrigger></FieldContent>
                                            <SelectContent>
                                                {["todo", "in_progress", "done", "cancelled"].map((s) => (
                                                    <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {fieldState.error && <FieldError errors={[fieldState.error]} />}
                                    </Field>
                                )} />
                            )}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Saving..." : isEdit ? "Save changes" : "Create task"}
                            </Button>
                        </DialogFooter>
                    </FieldGroup>
                </form>
            </DialogContent>
        </Dialog>
    )
}