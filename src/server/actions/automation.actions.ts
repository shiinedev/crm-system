"use server"

import {  managerActionClient, ActionError } from "./safe-action"
import {
  createWorkflow,
  updateWorkflow,
  toggleWorkflow,
  deleteWorkflow,
} from "@/db/queries/automation.queries"
import { deleteWorkflowSchema, toggleWorkflowSchema, updateWorkflowSchema, workflowSchema } from "@/lib/validations/automation"
import { logAudit } from "@/server/audit"



export const createWorkflowAction = managerActionClient
  .inputSchema(workflowSchema)
  .action(async ({ parsedInput, ctx }) => {
    const workflow = await createWorkflow({
      ...parsedInput,
      organizationId: ctx.orgId,
      createdById: ctx.user.id,
    })
    await logAudit({
      orgId: ctx.orgId,
      userId: ctx.user.id,
      action: "workflow.created",
      resourceType: "workflow",
      resourceId: workflow.id,
      after: workflow,
    })
    return { workflow }
  })

export const updateWorkflowAction = managerActionClient
  .inputSchema(updateWorkflowSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { id, ...data } = parsedInput
    const workflow = await updateWorkflow(id, ctx.orgId, data)
    if (!workflow) throw new ActionError("Workflow not found.")
    await logAudit({
      orgId: ctx.orgId,
      userId: ctx.user.id,
      action: "workflow.updated",
      resourceType: "workflow",
      resourceId: workflow.id,
      after: data,
    })
    return { workflow }
  })

export const toggleWorkflowAction = managerActionClient
  .inputSchema(toggleWorkflowSchema)
  .action(async ({ parsedInput, ctx }) => {
    const workflow = await toggleWorkflow(parsedInput.id, ctx.orgId, parsedInput.isActive)
    if (!workflow) throw new ActionError("Workflow not found.")
    await logAudit({
      orgId: ctx.orgId,
      userId: ctx.user.id,
      action: parsedInput.isActive ? "workflow.enabled" : "workflow.disabled",
      resourceType: "workflow",
      resourceId: workflow.id,
    })
    return { workflow }
  })

export const deleteWorkflowAction = managerActionClient
  .inputSchema(deleteWorkflowSchema)
  .action(async ({ parsedInput, ctx }) => {
    await deleteWorkflow(parsedInput.id, ctx.orgId)
    await logAudit({
      orgId: ctx.orgId,
      userId: ctx.user.id,
      action: "workflow.deleted",
      resourceType: "workflow",
      resourceId: parsedInput.id,
    })
    return { success: true }
  })
