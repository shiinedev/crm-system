import { Inngest } from "inngest"

export const inngest = new Inngest({ id: "crm-saas" })

// ── Event types
export type CrmEvents = {
  "crm/deal.stage.changed": {
    data: { dealId: string; fromStageId: string; toStageId: string; orgId: string; userId: string }
  }
  "crm/contact.created": {
    data: { contactId: string; orgId: string; userId: string }
  }
  "crm/deal.created": {
    data: { dealId: string; orgId: string; userId: string }
  }
  "crm/task.due": {
    data: { taskId: string; orgId: string; assignedToId: string }
  }
  "crm/meeting.ended": {
    data: { activityId: string; orgId: string; userId: string }
  }
  "crm/automation.trigger": {
    data: { workflowId: string; orgId: string; resourceId: string; resourceType: string }
  }
}
