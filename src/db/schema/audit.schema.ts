import {
    pgTable,
    text,
    timestamp,
    index,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const auditLogs = pgTable(
    "audit_logs",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => createId()),
        organizationId: text("organization_id").notNull(),
        userId: text("user_id"),
        action: text("action").notNull(), // e.g. "company.created", "deal.stage.changed"
        resourceType: text("resource_type").notNull(),
        resourceId: text("resource_id").notNull(),
        before: text("before"), // JSON snapshot
        after: text("after"), // JSON snapshot
        ipAddress: text("ip_address"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (t) => [
        index("audit_logs_org_idx").on(t.organizationId),
        index("audit_logs_resource_idx").on(t.resourceType, t.resourceId),
        index("audit_logs_user_idx").on(t.userId),
    ]
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;