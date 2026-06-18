import { inngest } from "../client"
import { getActiveWorkflowsByOrg } from "@/db/queries/automation.queries"
import { getDealById } from "@/db/queries/deals.queries"
import { getContactById } from "@/db/queries/contacts.queries"
import { createNotification } from "@/db/queries/notifications.queries"
import { createActivity } from "@/db/queries/activities.queries"
import { createTask } from "@/db/queries/tasks.queries"
import { Priority } from "@/db/schema"

// interface TriggerConfig { type: string; stageId?: string }
interface Condition { field: string; operator: "eq" | "gt" | "lt" | "contains"; value: string | number }
interface Action { type: "notify_user" | "create_task" | "log_activity"; config: Record<string, string> }

export const automationRunner = inngest.createFunction(
  {
    id: "automation-runner",
    triggers: [{ event: "crm/automation.trigger" }],
  },
  async ({ event }: { event: { data: { orgId: string; resourceId: string; resourceType: string } } }) => {
    const { orgId, resourceId, resourceType } = event.data
    const workflows = await getActiveWorkflowsByOrg(orgId)

    for (const workflow of workflows) {
      const conditions = workflow.conditions ? (JSON.parse(workflow.conditions) as Condition[]) : []
      const actions = JSON.parse(workflow.actions) as Action[]

      let resource: Record<string, unknown> | null = null
      if (resourceType === "deal") resource = await getDealById(resourceId, orgId)
      if (resourceType === "contact") resource = await getContactById(resourceId, orgId)
      if (!resource) continue

      const conditionsMet = conditions.every((c) => {
        const fieldValue = resource![c.field]
        if (c.operator === "eq") return String(fieldValue) === String(c.value)
        if (c.operator === "gt") return Number(fieldValue) > Number(c.value)
        if (c.operator === "lt") return Number(fieldValue) < Number(c.value)
        if (c.operator === "contains") return String(fieldValue).includes(String(c.value))
        return false
      })

      if (!conditionsMet) continue

      for (const action of actions) {
        if (action.type === "notify_user" && action.config.userId) {
          await createNotification({
            organizationId: orgId,
            userId: action.config.userId,
            type: "workflow_run",
            title: action.config.title ?? `Workflow: ${workflow.name}`,
            body: action.config.body,
            metadata: JSON.stringify({ workflowId: workflow.id, resourceId, resourceType }),
          })
        }
        if (action.type === "create_task") {
          await createTask({
            organizationId: orgId,
            title: action.config.title ?? `Task from ${workflow.name}`,
            description: action.config.description,
            priority: (action.config.priority  as Priority) ?? "medium",
            assignedToId: action.config.assignedToId,
            dealId: resourceType === "deal" ? resourceId : undefined,
            contactId: resourceType === "contact" ? resourceId : undefined,
          })
        }
        if (action.type === "log_activity") {
          await createActivity({
            organizationId: orgId,
            type: "status_change",
            title: action.config.title ?? `Automation: ${workflow.name}`,
            body: action.config.body,
            dealId: resourceType === "deal" ? resourceId : undefined,
            contactId: resourceType === "contact" ? resourceId : undefined,
          })
        }
      }
    }
  }
)
