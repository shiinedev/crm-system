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
import { useTRPC } from "@/lib/trpc/client"
import { useCreateDeal, useUpdateDeal } from "../hooks/use-deal-mutations"
import type { Deal } from "@/db/schema"
import { FieldGroup, Field, FieldContent, FieldError, FieldLabel, } from "@/components/ui/field"
import { useQuery } from "@tanstack/react-query"

// Keep all fields as strings to avoid coerce type conflicts with resolver
const schema = z.object({
    title: z.string().min(1, "Title is required"),
    value: z.string().optional(),
    currency: z.string().min(1),
    probability: z.string().optional(),
    pipelineId: z.string().min(1, "Pipeline is required"),
    stageId: z.string().min(1, "Stage is required"),
    expectedCloseDate: z.string().optional(),
    priority: z.enum(["low", "medium", "high", "urgent", ""]).optional(),
    dealSource: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface DealFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    deal?: Deal
    defaultPipelineId?: string
    defaultStageId?: string
}

export function DealFormDialog({ open, onOpenChange, deal, defaultPipelineId, defaultStageId }: DealFormDialogProps) {
    const isEdit = !!deal
    const { execute: createDeal, isPending: isCreating } = useCreateDeal()
    const { execute: updateDeal, isPending: isUpdating } = useUpdateDeal()
    const isPending = isCreating || isUpdating

    const trpc = useTRPC()

    const { data: pipelines = [] } = useQuery(trpc.pipelines.list.queryOptions())

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            title: "", value: "", currency: "USD", probability: "",
            pipelineId: defaultPipelineId ?? "", stageId: defaultStageId ?? "",
            expectedCloseDate: "", priority: "", dealSource: "",
        },
    })

    const selectedPipelineId = form.watch("pipelineId")
    const { data: pipelineWithStages } = useQuery(trpc.pipelines.getWithStages.queryOptions(
        { id: selectedPipelineId },
        { enabled: !!selectedPipelineId }
    ))
    const stages = pipelineWithStages?.stages ?? []

    useEffect(() => {
        if (open) {
            form.reset(deal ? {
                title: deal.title,
                value: deal.value ?? "",
                currency: deal.currency ?? "USD",
                probability: deal.probability?.toString() ?? "",
                pipelineId: deal.pipelineId,
                stageId: deal.stageId,
                expectedCloseDate: deal.expectedCloseDate ?? "",
                priority: (deal.priority as FormValues["priority"]) ?? "",
                dealSource: deal.dealSource ?? "",
            } : {
                title: "", value: "", currency: "USD", probability: "",
                pipelineId: defaultPipelineId ?? "", stageId: defaultStageId ?? "",
                expectedCloseDate: "", priority: "", dealSource: "",
            })
        }
    }, [open, deal, defaultPipelineId, defaultStageId])

    useEffect(() => {
        if (!isEdit) form.setValue("stageId", "")
    }, [selectedPipelineId])

    function onSubmit(values: FormValues) {
        const payload = {
            title: values.title,
            value: values.value || undefined,
            currency: values.currency,
            probability: values.probability ? Number(values.probability) : undefined,
            pipelineId: values.pipelineId,
            stageId: values.stageId,
            expectedCloseDate: values.expectedCloseDate || undefined,
            priority: (values.priority || undefined) as "low" | "medium" | "high" | "urgent" | undefined,
            dealSource: values.dealSource || undefined,
        }
        if (isEdit) {
            updateDeal({ id: deal.id, ...payload })
        } else {
            createDeal(payload)
        }
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit deal" : "New deal"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FieldGroup className="grid grid-cols-2 gap-3">
                        <Controller control={form.control} name="title" render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid} className="col-span-2">
                                <FieldLabel>Deal title *</FieldLabel>
                                <FieldContent><Input placeholder="Acme Corp — Enterprise Plan" {...field} /></FieldContent>
                                {fieldState.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )} />
                        <Controller control={form.control} name="value" render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>Value</FieldLabel>
                                <FieldContent><Input placeholder="10000" {...field} data-invalid={fieldState.invalid} /></FieldContent>
                                {fieldState.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )} />
                        <Controller control={form.control} name="currency" render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>Currency</FieldLabel>
                                <Select value={field.value} onValueChange={field.onChange} data-invalid={fieldState.invalid}>
                                    <FieldContent><SelectTrigger className=" w-full"><SelectValue /></SelectTrigger></FieldContent>
                                    <SelectContent>
                                        {["USD", "EUR", "GBP", "CAD", "AUD"].map((c) => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {fieldState.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )} />
                        <Controller control={form.control} name="pipelineId" render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>Pipeline *</FieldLabel>
                                <Select value={field.value} onValueChange={field.onChange} data-invalid={fieldState.invalid}>
                                    <FieldContent><SelectTrigger className=" w-full"><SelectValue placeholder="Select pipeline" /></SelectTrigger></FieldContent>
                                    <SelectContent>
                                        {pipelines.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {fieldState.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )} />
                        <Controller control={form.control} name="stageId" render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>Stage *</FieldLabel>
                                <Select value={field.value} onValueChange={field.onChange} disabled={!selectedPipelineId} data-invalid={fieldState.invalid}>
                                    <FieldContent><SelectTrigger className=" w-full"><SelectValue placeholder="Select stage" /></SelectTrigger></FieldContent>
                                    <SelectContent>
                                        {stages.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {fieldState.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )} />
                        <Controller control={form.control} name="priority" render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>Priority</FieldLabel>
                                <Select value={field.value ?? ""} onValueChange={field.onChange} data-invalid={fieldState.invalid}>
                                    <FieldContent><SelectTrigger className=" w-full"><SelectValue placeholder="Select priority" /></SelectTrigger></FieldContent>
                                    <SelectContent>
                                        {["low", "medium", "high", "urgent"].map((p) => (
                                            <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {fieldState.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )} />
                        <Controller control={form.control} name="expectedCloseDate" render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>Close date</FieldLabel>
                                <FieldContent><Input type="date" {...field} data-invalid={fieldState.invalid} /></FieldContent>
                                {fieldState.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )} />
                    </FieldGroup>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Saving..." : isEdit ? "Save changes" : "Create deal"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}