"use client"

import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCreateCompany, useUpdateCompany } from "../hooks/use-company-mutations"
import { slugify } from "@/utils/slugify"
import type { Company } from "@/db/schema"
import { createCompanySchema } from "@/lib/validations/companies"
import { FieldGroup ,Field,FieldContent,FieldDescription,FieldError,FieldLabel} from "@/components/ui/field"
import { Loader2 } from "lucide-react"



type FormValues = z.infer<typeof createCompanySchema>

interface CompanyFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    company?: Company
}

export function CompanyFormDialog({ open, onOpenChange, company }: CompanyFormDialogProps) {
    const isEdit = !!company
    const { execute: createCompany, isPending: isCreating } = useCreateCompany()
    const { execute: updateCompany, isPending: isUpdating } = useUpdateCompany()
   

    const form = useForm({
        resolver: zodResolver(createCompanySchema),
        defaultValues: {
            name: "",
            slug: "",
            website: "",
             industry: "", 
             companySize: "",
              country: "", 
              city: "", 
              notes: "",

        },
    })

     const isPending = isCreating || isUpdating || form.formState.isSubmitting
    useEffect(() => {
        if (open) {
            form.reset(company ? {
                name: company.name, slug: company.slug, website: company.website ?? "",
                industry: company.industry ?? "", companySize: company.companySize ?? "",
                country: company.country ?? "", city: company.city ?? "",
                lifecycleStage: company.lifecycleStage ?? undefined,
                leadSource: company.leadSource ?? undefined, notes: company.notes ?? "",
            } : { name: "", slug: "", website: "", industry: "", companySize: "", country: "", city: "", notes: "" })
        }
    }, [open, company])

    function onSubmit(values: FormValues) {
        if (isEdit) {
            updateCompany({ id: company.id, ...values })
        } else {
            createCompany(values)
        }
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit company" : "Add company"}</DialogTitle>
                </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FieldGroup className="grid grid-cols-2 gap-3">
                            <Controller
                                control={form.control}
                                name="name"
                                render={({ field,fieldState }) => (
                                    <Field  date-invalid={fieldState.invalid}>
                                        <FieldLabel>Company name *</FieldLabel>
                                        <FieldContent>
                                            <Input
                                                placeholder="Acme Corp"
                                                {...field}
                                                date-invalid={fieldState.invalid}
                                                onChange={(e) => {
                                                    field.onChange(e)
                                                    if (!isEdit) form.setValue("slug", slugify(e.target.value))
                                                }}
                                            />
                                        </FieldContent>
                                        <FieldError  errors={[fieldState.error]}  />
                                    </Field>
                                )}
                            />
                            <Controller
                                control={form.control}
                                name="slug"
                                render={({ field,fieldState }) => (
                                    <Field  date-invalid={fieldState.invalid}>
                                        <FieldLabel>Slug *</FieldLabel>
                                        <FieldContent><Input placeholder="acme-corp" {...field} date-invalid={fieldState.invalid} /></FieldContent>
                                        <FieldError  errors={[fieldState.error]}  />
                                    </Field>
                                )}
                            />
                            <Controller
                                control={form.control}
                                name="website"
                                render={({ field,fieldState }) => (
                                    <Field  date-invalid={fieldState.invalid}>
                                        <FieldLabel>Website</FieldLabel>
                                        <FieldContent><Input placeholder="https://acme.com" {...field} date-invalid={fieldState.invalid} /></FieldContent>
                                        <FieldError  errors={[fieldState.error]}  />
                                    </Field>
                                )}
                            />
                            <Controller
                                control={form.control}
                                name="industry"
                                render={({ field,fieldState }) => (
                                    <Field  date-invalid={fieldState.invalid}>
                                        <FieldLabel>Industry</FieldLabel>
                                        <FieldContent><Input placeholder="SaaS" {...field} date-invalid={fieldState.invalid} /></FieldContent>
                                        <FieldError  errors={[fieldState.error]}  />
                                    </Field>
                                )}
                            />
                            <Controller
                                control={form.control}
                                name="companySize"
                                render={({ field,fieldState }) => (
                                    <Field  date-invalid={fieldState.invalid}>
                                        <FieldLabel>Company size</FieldLabel>
                                        <Select value={field.value ?? ""} onValueChange={field.onChange}>
                                            <FieldContent><SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger></FieldContent>
                                            <SelectContent>
                                                {["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"].map((s) => (
                                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FieldError  errors={[fieldState.error]}  />
                                    </Field>
                                )}
                            />
                            <Controller
                                control={form.control}
                                name="lifecycleStage"
                                render={({ field,fieldState }) => (
                                    <Field  date-invalid={fieldState.invalid}>
                                        <FieldLabel>Lifecycle stage</FieldLabel>
                                        <Select value={field.value ?? ""} onValueChange={field.onChange}>
                                            <FieldContent><SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger></FieldContent>
                                            <SelectContent>
                                                {["lead", "prospect", "opportunity", "customer", "churned"].map((s) => (
                                                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FieldError  errors={[fieldState.error]}  />
                                    </Field>
                                )}
                            />
                            <Controller
                                control={form.control}
                                name="city"
                                render={({ field,fieldState }) => (
                                    <Field  date-invalid={fieldState.invalid}>
                                        <FieldLabel>City</FieldLabel>
                                        <FieldContent><Input placeholder="San Francisco" {...field} date-invalid={fieldState.invalid} /></FieldContent>
                                        <FieldError  errors={[fieldState.error]}  />
                                    </Field>
                                )}
                            />
                            <Controller
                                control={form.control}
                                name="country"
                                render={({ field,fieldState }) => (
                                    <Field  date-invalid={fieldState.invalid}>
                                        <FieldLabel>Country</FieldLabel>
                                        <FieldContent><Input placeholder="United States" {...field} date-invalid={fieldState.invalid} /></FieldContent>
                                        <FieldError  errors={[fieldState.error]}  />
                                    </Field>
                                )}
                            />
                            <Controller
                                control={form.control}
                                name="notes"
                                render={({ field,fieldState }) => (
                                    <Field className="col-span-2" date-invalid={fieldState.invalid}>
                                        <FieldLabel>Notes</FieldLabel>
                                        <FieldContent><Textarea placeholder="Any additional notes..." {...field} date-invalid={fieldState.invalid} /></FieldContent>
                                        <FieldError  errors={[fieldState.error]}  />
                                    </Field>
                                )}
                            />
                        </FieldGroup>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? <Loader2 className="animate-spin" /> : isEdit ? "Save changes" : "Create company"}
                            </Button>
                        </DialogFooter>
                    </form>
            </DialogContent>
        </Dialog>
    )
}