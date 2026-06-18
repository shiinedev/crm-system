"use server"

import {  managerActionClient, ActionError } from "./safe-action"
import {
  createWorkflow,
  updateWorkflow,
  toggleWorkflow,
  deleteWorkflow,
} from "@/db/queries/automation.queries"
import { deleteWorkflowSchema, toggleWorkflowSchema, updateWorkflowSchema, workflowSchema } from "@/lib/validations/automation"



export const createWorkflowAction = managerActionClient
  .inputSchema(workflowSchema)
  .action(async ({ parsedInput, ctx }) => {
    const workflow = await createWorkflow({
      ...parsedInput,
      organizationId: ctx.orgId,
      createdById: ctx.user.id,
    })
    return { workflow }
  })

export const updateWorkflowAction = managerActionClient
  .inputSchema(updateWorkflowSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { id, ...data } = parsedInput
    const workflow = await updateWorkflow(id, ctx.orgId, data)
    if (!workflow) throw new ActionError("Workflow not found.")
    return { workflow }
  })

export const toggleWorkflowAction = managerActionClient
  .inputSchema(toggleWorkflowSchema)
  .action(async ({ parsedInput, ctx }) => {
    const workflow = await toggleWorkflow(parsedInput.id, ctx.orgId, parsedInput.isActive)
    if (!workflow) throw new ActionError("Workflow not found.")
    return { workflow }
  })

export const deleteWorkflowAction = managerActionClient
  .inputSchema(deleteWorkflowSchema)
  .action(async ({ parsedInput, ctx }) => {
    await deleteWorkflow(parsedInput.id, ctx.orgId)
    return { success: true }
  })
