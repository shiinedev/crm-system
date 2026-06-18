import {
    pgTable,
    pgEnum,
    text,
    timestamp,
    boolean,
    index,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { organizations, users } from "./auth.schema";
import { companies } from "./companies.schema";
import { contacts } from "./contacts.schema";
import { deals } from "./deals.schema";
import { priorityEnum } from "./deals.schema";

export const taskStatusEnum = pgEnum("task_status", [
    "todo",
    "in_progress",
    "done",
    "cancelled",
]);

export const tasks = pgTable(
    "tasks",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => createId()),
        organizationId: text("organization_id")
            .notNull()
            .references(() => organizations.id, { onDelete: "cascade" }),
        title: text("title").notNull(),
        description: text("description"),
        priority: priorityEnum("priority").default("medium"),
        status: taskStatusEnum("status").default("todo"),
        dueDate: timestamp("due_date"),
        reminderAt: timestamp("reminder_at"),
        assignedToId: text("assigned_to_id").references(() => users.id, {
            onDelete: "set null",
        }),
        dealId: text("deal_id").references(() => deals.id, {
            onDelete: "set null",
        }),
        companyId: text("company_id").references(() => companies.id, {
            onDelete: "set null",
        }),
        contactId: text("contact_id").references(() => contacts.id, {
            onDelete: "set null",
        }),
        recurrenceRule: text("recurrence_rule"),
        aiSuggested: boolean("ai_suggested").default(false),
        deletedAt: timestamp("deleted_at"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (t) => [
        index("tasks_org_idx").on(t.organizationId),
        index("tasks_assignee_idx").on(t.assignedToId),
        index("tasks_deal_idx").on(t.dealId),
        index("tasks_status_idx").on(t.status),
    ]
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
