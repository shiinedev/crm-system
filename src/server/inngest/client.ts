import { Inngest, eventType } from "inngest"
import { z } from "zod"

export const inngest = new Inngest({ id: "crm-saas" })

// ── Typed event definitions (used as triggers and for sending)

export const dealCreatedEvent = eventType("crm/deal.created", {
  schema: z.object({ dealId: z.string(), orgId: z.string(), userId: z.string() }),
})

export const dealStageChangedEvent = eventType("crm/deal.stage.changed", {
  schema: z.object({
    dealId: z.string(),
    fromStageId: z.string(),
    toStageId: z.string(),
    orgId: z.string(),
    userId: z.string(),
  }),
})

export const contactCreatedEvent = eventType("crm/contact.created", {
  schema: z.object({ contactId: z.string(), orgId: z.string(), userId: z.string() }),
})

export const taskDueEvent = eventType("crm/task.due", {
  schema: z.object({ taskId: z.string(), orgId: z.string(), assignedToId: z.string() }),
})

export const meetingEndedEvent = eventType("crm/meeting.ended", {
  schema: z.object({ activityId: z.string(), orgId: z.string(), userId: z.string() }),
})

/**
 * Fire-and-forget event send. Inngest being unreachable (e.g. no dev
 * server running locally) must never fail the mutation that emitted
 * the event. Usage: `await sendEvent(dealCreatedEvent.create({ ... }))`
 */
export async function sendEvent(event: { name: string; data: Record<string, unknown> }): Promise<void> {
  try {
    await inngest.send(event)
  } catch (error) {
    console.error(`[inngest] failed to send ${event.name}`, error)
  }
}
