import {z} from "zod"

export const workflowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  trigger: z.string().min(1, "Trigger is required"), // JSON string
  conditions: z.string().optional(),                  // JSON string
  actions: z.string().min(1, "At least one action is required"), // JSON string
})


export const updateWorkflowSchema = workflowSchema.extend({ id: z.string()})

export const toggleWorkflowSchema = z.object({ id: z.string(), isActive: z.boolean() });


 export const deleteWorkflowSchema = z.object({ id: z.string() });
