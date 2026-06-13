import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { organizations, users } from "./auth.schema";
import { companies } from "./companies.schema";
import { contacts } from "./contacts.schema";
import { deals } from "./deals.schema";

export const activityTypeEnum = pgEnum("activity_type", [
  "call",
  "meeting",
  "email",
  "note",
  "task",
  "status_change",
  "document_upload",
  "comment",
]);

export const activities = pgTable(
  "activities",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    type: activityTypeEnum("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    metadata: text("metadata"), // JSON string
    // Polymorphic relations — at least one must be set
    companyId: text("company_id").references(() => companies.id, {
      onDelete: "cascade",
    }),
    contactId: text("contact_id").references(() => contacts.id, {
      onDelete: "cascade",
    }),
    dealId: text("deal_id").references(() => deals.id, {
      onDelete: "cascade",
    }),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("activities_org_idx").on(t.organizationId),
    index("activities_deal_idx").on(t.dealId),
    index("activities_company_idx").on(t.companyId),
    index("activities_contact_idx").on(t.contactId),
    index("activities_user_idx").on(t.userId),
  ]
);

export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;