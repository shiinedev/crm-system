import "server-only"
import { eq, and, desc } from "drizzle-orm"
import { db } from "@/db"
import { auditLogs, type NewAuditLog } from "@/db/schema"

export async function getAuditLogsByOrg(organizationId: string, limit = 50) {
  return db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.organizationId, organizationId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
}

export async function getAuditLogsByResource(
  resourceType: string,
  resourceId: string,
  organizationId: string
) {
  return db
    .select()
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.organizationId, organizationId),
        eq(auditLogs.resourceType, resourceType),
        eq(auditLogs.resourceId, resourceId)
      )
    )
    .orderBy(desc(auditLogs.createdAt))
}

export async function createAuditLog(data: NewAuditLog) {
  const [log] = await db.insert(auditLogs).values(data).returning()
  return log
}
