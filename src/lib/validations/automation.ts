import { z } from "zod"

// ── Workflow trigger / condition / action shapes
// Stored as JSON strings in the DB, but validated for real at save time
// and re-validated defensively when the automation runner executes them.

export const workflowTriggerTypes = [
  "deal.stage.changed",
  "deal.created",
  "contact.created",
  "task.due",
] as const

export type WorkflowTriggerType = (typeof workflowTriggerTypes)[number]

export const triggerConfigSchema = z.object({
  type: z.enum(workflowTriggerTypes),
  /** Only meaningful for deal.stage.changed: restrict to a target stage */
  stageId: z.string().optional(),
})

export const workflowConditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(["eq", "gt", "lt", "contains"]),
  value: z.union([z.string(), z.number()]),
})

export const workflowActionSchema = z.object({
  type: z.enum(["notify_user", "create_task", "log_activity"]),
  config: z.record(z.string(), z.string()).default({}),
})

export const workflowConditionsSchema = z.array(workflowConditionSchema)
export const workflowActionsSchema = z.array(workflowActionSchema).min(1)

export type TriggerConfig = z.infer<typeof triggerConfigSchema>
export type WorkflowCondition = z.infer<typeof workflowConditionSchema>
export type WorkflowAction = z.infer<typeof workflowActionSchema>

/** Validates that a string is JSON conforming to the given schema. */
function jsonString<T extends z.ZodTypeAny>(schema: T, label: string) {
  return z.string().superRefine((value, ctx) => {
    let parsed: unknown
    try {
      parsed = JSON.parse(value)
    } catch {
      ctx.addIssue({ code: "custom", message: `${label} is not valid JSON` })
      return
    }
    const result = schema.safeParse(parsed)
    if (!result.success) {
      ctx.addIssue({ code: "custom", message: `${label} has an invalid shape` })
    }
  })
}

export const workflowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  trigger: jsonString(triggerConfigSchema, "Trigger"),
  conditions: jsonString(workflowConditionsSchema, "Conditions").optional(),
  actions: jsonString(workflowActionsSchema, "Actions"),
})

export const updateWorkflowSchema = workflowSchema.extend({ id: z.string() })

export const toggleWorkflowSchema = z.object({ id: z.string(), isActive: z.boolean() })

export const deleteWorkflowSchema = z.object({ id: z.string() })
