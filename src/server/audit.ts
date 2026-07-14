import "server-only"
import { createAuditLog } from "@/db/queries/audit.queries"

/**
 * Write an audit trail entry. Fire-and-forget: an audit failure must
 * never fail the mutation it describes, so errors are logged and
 * swallowed.
 */
export async function logAudit(params: {
  orgId: string
  userId?: string | null
  /** e.g. "company.created", "deal.stage.changed" */
  action: string
  /** e.g. "company", "deal" */
  resourceType: string
  resourceId: string
  before?: unknown
  after?: unknown
}) {
  try {
    await createAuditLog({
      organizationId: params.orgId,
      userId: params.userId ?? undefined,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      before: params.before !== undefined ? JSON.stringify(params.before) : undefined,
      after: params.after !== undefined ? JSON.stringify(params.after) : undefined,
    })
  } catch (error) {
    console.error("[audit] failed to write audit log", error)
  }
}
