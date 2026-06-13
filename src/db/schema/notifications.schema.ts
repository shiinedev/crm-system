import {
    pgTable,
    pgEnum,
    text,
    timestamp,
    index,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { organizations, users } from "./auth.schema";

export const notificationTypeEnum = pgEnum("notification_type", [
    "mention",
    "assignment",
    "deal_update",
    "task_due",
    "ai_insight",
    "workflow_run",
    "system",
]);

export const notifications = pgTable(
    "notifications",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => createId()),
        organizationId: text("organization_id")
            .notNull()
            .references(() => organizations.id, { onDelete: "cascade" }),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: notificationTypeEnum("type").notNull(),
        title: text("title").notNull(),
        body: text("body"),
        metadata: text("metadata"), // JSON string
        readAt: timestamp("read_at"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (t) => [
        index("notifications_user_idx").on(t.userId),
        index("notifications_org_idx").on(t.organizationId),
        index("notifications_unread_idx").on(t.userId, t.readAt),
    ]
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;