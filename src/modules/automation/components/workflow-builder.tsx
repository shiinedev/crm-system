"use client"

import { useEffect } from "react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Field, FieldContent, FieldGroup, FieldLabel, FieldError,
} from "@/components/ui/field"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useAction } from "next-safe-action/hooks"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {  useTRPC } from "@/lib/trpc/client"
import { createWorkflowAction, updateWorkflowAction } from "@/server/actions/automation.actions"
import type { AutomationWorkflow } from "@/db/schema"

const TRIGGER_TYPES = [
  { value: "deal.stage.changed", label: "Deal stage changed" },
  { value: "deal.created", label: "Deal created" },
  { value: "contact.created", label: "Contact created" },
  { value: "task.due", label: "Task is due" },
] as const

const ACTION_TYPES = [
  { value: "notify_user", label: "Notify a user" },
  { value: "create_task", label: "Create a task" },
  { value: "log_activity", label: "Log an activity" },
] as const

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  triggerType: z.string().min(1, "Trigger is required"),
  actions: z.array(z.object({
    type: z.string().min(1, "Action type is required"),
    title: z.string().min(1, "Title is required"),
    body: z.string().optional(),
  })).min(1, "At least one action is required"),
})

type FormValues = z.infer<typeof schema>

interface WorkflowBuilderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflow?: AutomationWorkflow
}

export function WorkflowBuilder({ open, onOpenChange, workflow }: WorkflowBuilderProps) {
  const isEdit = !!workflow


  const { execute: create, isPending: isCreating } = useAction(createWorkflowAction, {
    onSuccess: () => {
      toast.success("Workflow created")
      onOpenChange(false)
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to create workflow"),
  })

  const { execute: update, isPending: isUpdating } = useAction(updateWorkflowAction, {
    onSuccess: () => {
      toast.success("Workflow updated")
      onOpenChange(false)
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to update workflow"),
  })

  const isPending = isCreating || isUpdating

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      triggerType: "",
      actions: [{ type: "", title: "", body: "" }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "actions",
  })

  useEffect(() => {
    if (!open) return
    if (workflow) {
      const trigger = JSON.parse(workflow.trigger) as { type: string }
      const actions = JSON.parse(workflow.actions) as Array<{ type: string; config: Record<string, string> }>
      form.reset({
        name: workflow.name,
        triggerType: trigger.type,
        actions: actions.map((a) => ({
          type: a.type,
          title: a.config.title ?? "",
          body: a.config.body ?? "",
        })),
      })
    } else {
      form.reset({ name: "", triggerType: "", actions: [{ type: "", title: "", body: "" }] })
    }
  }, [open, workflow])

  function onSubmit(values: FormValues) {
    const trigger = JSON.stringify({ type: values.triggerType })
    const actions = JSON.stringify(
      values.actions.map((a) => ({
        type: a.type,
        config: { title: a.title, body: a.body ?? "" },
      }))
    )
    if (isEdit) {
      update({ id: workflow.id, name: values.name, trigger, actions })
    } else {
      create({ name: values.name, trigger, actions })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit workflow" : "New workflow"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FieldGroup>
            <Controller control={form.control} name="name" render={({ field ,fieldState}) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Workflow name *</FieldLabel>
                <FieldContent><Input placeholder="Notify on deal stage change" data-invalid={fieldState.invalid} {...field} /></FieldContent>
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )} />

            {/* Trigger */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Trigger</p>
              <Controller control={form.control} name="triggerType" render={({ field,fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>When this happens *</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange} data-invalid={fieldState.invalid}>
                    <FieldContent><SelectTrigger data-invalid={fieldState.invalid}><SelectValue placeholder="Select trigger" /></SelectTrigger></FieldContent>
                    <SelectContent>
                      {TRIGGER_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && <FieldError errors={[fieldState.error]} />}
                </Field>
              )} />
            </div>

            <Separator />

            {/* Actions */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Actions</p>
              <div className="space-y-3">
                {fields.map((field, idx) => (
                  <div key={field.id} className="rounded-lg border p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Action {idx + 1}</span>
                      {fields.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => remove(idx)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <Controller control={form.control} name={`actions.${idx}.type`} render={({ field,fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Action type *</FieldLabel>
                        <Select value={field.value} onValueChange={field.onChange} data-invalid={fieldState.invalid}>
                          <FieldContent><SelectTrigger data-invalid={fieldState.invalid}><SelectValue placeholder="Select action" /></SelectTrigger></FieldContent>
                          <SelectContent>
                            {ACTION_TYPES.map((a) => (
                              <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldState.error && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )} />
                    <Controller control={form.control} name={`actions.${idx}.title`} render={({ field,fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Title *</FieldLabel>
                        <FieldContent><Input placeholder="Action title or message" data-invalid={fieldState.invalid} {...field} /></FieldContent>
                        {fieldState.error && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )} />
                    <Controller control={form.control} name={`actions.${idx}.body`} render={({ field,fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Body</FieldLabel>
                        <FieldContent><Input placeholder="Optional detail" data-invalid={fieldState.invalid} {...field} /></FieldContent>
                        {fieldState.error && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )} />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={() => append({ type: "", title: "", body: "" })}
                >
                  <Plus className="h-3.5 w-3.5" />Add action
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : isEdit ? "Save changes" : "Create workflow"}
              </Button>
            </DialogFooter>
          </FieldGroup>
          </form>
      </DialogContent>
    </Dialog>
  )
}
