import "server-only"
import { eq, and, desc } from "drizzle-orm"
import { db } from "@/db"
import { automationWorkflows, type NewAutomationWorkflow } from "@/db/schema"

export async function getWorkflowsByOrg(organizationId: string) {
  return db
    .select()
    .from(automationWorkflows)
    .where(eq(automationWorkflows.organizationId, organizationId))
    .orderBy(desc(automationWorkflows.createdAt))
}

export async function getActiveWorkflowsByOrg(organizationId: string) {
  return db
    .select()
    .from(automationWorkflows)
    .where(
      and(
        eq(automationWorkflows.organizationId, organizationId),
        eq(automationWorkflows.isActive, true)
      )
    )
    .orderBy(desc(automationWorkflows.createdAt))
}

export async function getWorkflowById(id: string, organizationId: string) {
  const [workflow] = await db
    .select()
    .from(automationWorkflows)
    .where(
      and(
        eq(automationWorkflows.id, id),
        eq(automationWorkflows.organizationId, organizationId)
      )
    )
    .limit(1)
  return workflow ?? null
}

export async function createWorkflow(data: NewAutomationWorkflow) {
  const [workflow] = await db.insert(automationWorkflows).values(data).returning()
  return workflow
}

export async function updateWorkflow(id: string, organizationId: string, data: Partial<NewAutomationWorkflow>) {
  const [workflow] = await db
    .update(automationWorkflows)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(automationWorkflows.id, id), eq(automationWorkflows.organizationId, organizationId)))
    .returning()
  return workflow ?? null
}

export async function toggleWorkflow(id: string, organizationId: string, isActive: boolean) {
  const [workflow] = await db
    .update(automationWorkflows)
    .set({ isActive, updatedAt: new Date() })
    .where(and(eq(automationWorkflows.id, id), eq(automationWorkflows.organizationId, organizationId)))
    .returning()
  return workflow ?? null
}

export async function deleteWorkflow(id: string, organizationId: string) {
  await db
    .delete(automationWorkflows)
    .where(and(eq(automationWorkflows.id, id), eq(automationWorkflows.organizationId, organizationId)))
}

export async function incrementWorkflowRunCount(id: string) {
  await db
    .update(automationWorkflows)
    .set({ runCount: db.$count(automationWorkflows), lastRunAt: new Date() })
    .where(eq(automationWorkflows.id, id))
}
