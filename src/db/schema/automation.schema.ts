import {
    pgTable,
    text,
    timestamp,
    boolean,
    integer,
    index,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { organizations, users } from "./auth.schema";

export const automationWorkflows = pgTable(
    "automation_workflows",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => createId()),
        organizationId: text("organization_id")
            .notNull()
            .references(() => organizations.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        description: text("description"),
        isActive: boolean("is_active").default(true),
        trigger: text("trigger").notNull(), // JSON: { type, config }
        conditions: text("conditions"), // JSON: []
        actions: text("actions").notNull(), // JSON: [{ type, config }]
        runCount: integer("run_count").default(0),
        lastRunAt: timestamp("last_run_at"),
        createdById: text("created_by_id").references(() => users.id, {
            onDelete: "set null",
        }),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (t) => [
        index("workflows_org_idx").on(t.organizationId),
        index("workflows_active_idx").on(t.organizationId, t.isActive),
    ]
);

export type AutomationWorkflow = typeof automationWorkflows.$inferSelect;
export type NewAutomationWorkflow = typeof automationWorkflows.$inferInsert;