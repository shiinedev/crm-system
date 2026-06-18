"use client"

import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Field,FieldGroup,FieldError,FieldContent,FieldLabel,
} from "@/components/ui/field"
import { useCreateNote, useUpdateDocument } from "../hooks/use-document-mutations"
import type { Document } from "@/db/schema"

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface DocumentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document?: Document
  companyId?: string
  dealId?: string
}

export function DocumentFormDialog({
  open, onOpenChange, document, companyId, dealId,
}: DocumentFormDialogProps) {
  const isEdit = !!document
  const { execute: createNote, isPending: isCreating } = useCreateNote()
  const { execute: updateDocument, isPending: isUpdating } = useUpdateDocument()
  const isPending = isCreating || isUpdating

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", content: "" },
  })

  useEffect(() => {
    if (open) {
      form.reset(document
        ? { title: document.title, content: document.content ?? "" }
        : { title: "", content: "" }
      )
    }
  }, [open, document])

  function onSubmit(values: FormValues) {
    if (isEdit) {
      updateDocument({ id: document.id, ...values })
    } else {
      createNote({ ...values, companyId, dealId })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit note" : "New note"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Controller control={form.control} name="title" render={({ field , fieldState}) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Title *</FieldLabel>
                <FieldContent><Input placeholder="Meeting notes, proposal draft..." {...field} /></FieldContent>
                {fieldState.error && <FieldError errors={[fieldState.error]} /> }
              </Field>
            )} />
            <Controller control={form.control} name="content" render={({ field,fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Content</FieldLabel>
                <FieldContent>
                  <Textarea
                    placeholder="Write your note here... Supports markdown."
                    rows={12}
                    data-invalid={fieldState.invalid}
                    className="font-mono text-sm resize-none"
                    {...field}
                  />
                </FieldContent>
                {fieldState.error && (<FieldError errors={[fieldState.error]} /> )}
              </Field >
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : isEdit ? "Save changes" : "Create note"}
              </Button>
            </DialogFooter>
          </FieldGroup>
          </form>
      </DialogContent>
    </Dialog>
  )
}
