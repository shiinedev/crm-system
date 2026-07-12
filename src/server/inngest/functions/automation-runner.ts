import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import { members } from "@/db/schema"
import {
  inngest,
  dealCreatedEvent,
  dealStageChangedEvent,
  contactCreatedEvent,
  taskDueEvent,
} from "../client"
import {
  getActiveWorkflowsByOrg,
  incrementWorkflowRunCount,
} from "@/db/queries/automation.queries"
import { getDealById } from "@/db/queries/deals.queries"
import { getContactById } from "@/db/queries/contacts.queries"
import { getTaskById } from "@/db/queries/tasks.queries"
import { createNotification } from "@/db/queries/notifications.queries"
import { createActivity } from "@/db/queries/activities.queries"
import { createTask } from "@/db/queries/tasks.queries"
import {
  triggerConfigSchema,
  workflowConditionsSchema,
  workflowActionsSchema,
  type WorkflowAction,
  type WorkflowCondition,
  type WorkflowTriggerType,
} from "@/lib/validations/automation"
import { Priority } from "@/db/schema"

type ResourceType = "deal" | "contact" | "task"

async function isOrgMember(userId: string, orgId: string): Promise<boolean> {
  const [member] = await db
    .select({ id: members.id })
    .from(members)
    .where(and(eq(members.userId, userId), eq(members.organizationId, orgId)))
    .limit(1)
  return !!member
}

function conditionsMet(conditions: WorkflowCondition[], resource: Record<string, unknown>): boolean {
  return conditions.every((c) => {
    const fieldValue = resource[c.field]
    if (c.operator === "eq") return String(fieldValue) === String(c.value)
    if (c.operator === "gt") return Number(fieldValue) > Number(c.value)
    if (c.operator === "lt") return Number(fieldValue) < Number(c.value)
    if (c.operator === "contains") return String(fieldValue).includes(String(c.value))
    return false
  })
}

async function runAction(params: {
  action: WorkflowAction
  orgId: string
  resourceId: string
  resourceType: ResourceType
  workflowId: string
  workflowName: string
  fallbackUserId: string | null
}) {
  const { action, orgId, resourceId, resourceType, workflowId, workflowName, fallbackUserId } = params

  if (action.type === "notify_user") {
    // Only notify members of this org; fall back to the workflow creator
    let targetUserId: string | null = action.config.userId ?? fallbackUserId
    if (targetUserId && !(await isOrgMember(targetUserId, orgId))) {
      targetUserId = fallbackUserId
    }
    if (!targetUserId) return

    await createNotification({
      organizationId: orgId,
      userId: targetUserId,
      type: "workflow_run",
      title: action.config.title || `Workflow: ${workflowName}`,
      body: action.config.body,
      metadata: JSON.stringify({ workflowId, resourceId, resourceType }),
    })
  }

  if (action.type === "create_task") {
    await createTask({
      organizationId: orgId,
      title: action.config.title || `Task from ${workflowName}`,
      description: action.config.description,
      priority: (action.config.priority as Priority) || "medium",
      assignedToId: action.config.assignedToId,
      dealId: resourceType === "deal" ? resourceId : undefined,
      contactId: resourceType === "contact" ? resourceId : undefined,
    })
  }

  if (action.type === "log_activity") {
    await createActivity({
      organizationId: orgId,
      type: "status_change",
      title: action.config.title || `Automation: ${workflowName}`,
      body: action.config.body,
      dealId: resourceType === "deal" ? resourceId : undefined,
      contactId: resourceType === "contact" ? resourceId : undefined,
    })
  }
}

export const automationRunner = inngest.createFunction(
  {
    id: "automation-runner",
    triggers: [dealCreatedEvent, dealStageChangedEvent, contactCreatedEvent, taskDueEvent],
  },
  async ({ event, logger }) => {
    // Map the domain event onto the workflow trigger vocabulary
    let triggerType: WorkflowTriggerType
    let resourceType: ResourceType
    let resourceId: string
    let toStageId: string | null = null

    switch (event.name) {
      case "crm/deal.created":
        triggerType = "deal.created"
        resourceType = "deal"
        resourceId = event.data.dealId
        break
      case "crm/deal.stage.changed":
        triggerType = "deal.stage.changed"
        resourceType = "deal"
        resourceId = event.data.dealId
        toStageId = event.data.toStageId
        break
      case "crm/contact.created":
        triggerType = "contact.created"
        resourceType = "contact"
        resourceId = event.data.contactId
        break
      case "crm/task.due":
        triggerType = "task.due"
        resourceType = "task"
        resourceId = event.data.taskId
        break
      default:
        return
    }

    const orgId = event.data.orgId
    const workflows = await getActiveWorkflowsByOrg(orgId)
    if (workflows.length === 0) return

    let resource: Record<string, unknown> | null = null
    if (resourceType === "deal") resource = await getDealById(resourceId, orgId)
    if (resourceType === "contact") resource = await getContactById(resourceId, orgId)
    if (resourceType === "task") resource = await getTaskById(resourceId, orgId)
    if (!resource) return

    for (const workflow of workflows) {
      // One bad workflow must not stop the others
      try {
        const trigger = triggerConfigSchema.safeParse(JSON.parse(workflow.trigger))
        if (!trigger.success) {
          logger.warn(`workflow ${workflow.id} has invalid trigger config, skipping`)
          continue
        }
        if (trigger.data.type !== triggerType) continue
        if (trigger.data.stageId && toStageId && trigger.data.stageId !== toStageId) continue

        let conditions: WorkflowCondition[] = []
        if (workflow.conditions) {
          const parsed = workflowConditionsSchema.safeParse(JSON.parse(workflow.conditions))
          if (!parsed.success) {
            logger.warn(`workflow ${workflow.id} has invalid conditions, skipping`)
            continue
          }
          conditions = parsed.data
        }
        if (!conditionsMet(conditions, resource)) continue

        const actions = workflowActionsSchema.safeParse(JSON.parse(workflow.actions))
        if (!actions.success) {
          logger.warn(`workflow ${workflow.id} has invalid actions, skipping`)
          continue
        }

        for (const action of actions.data) {
          await runAction({
            action,
            orgId,
            resourceId,
            resourceType,
            workflowId: workflow.id,
            workflowName: workflow.name,
            fallbackUserId: workflow.createdById ?? null,
          })
        }

        await incrementWorkflowRunCount(workflow.id)
      } catch (error) {
        logger.error(`workflow ${workflow.id} failed`, error)
      }
    }
  }
)
