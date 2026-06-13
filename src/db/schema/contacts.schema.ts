import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  integer,
  real,
  index,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { organizations, users } from "./auth.schema";
import { companies, leadSourceEnum } from "./companies.schema";

export const contactStatusEnum = pgEnum("contact_status", [
  "active",
  "inactive",
  "bounced",
]);

export const contacts = pgTable(
  "contacts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    companyId: text("company_id").references(() => companies.id, {
      onDelete: "set null",
    }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    avatar: text("avatar"),
    title: text("title"),
    department: text("department"),
    timezone: text("timezone"),
    preferredLanguage: text("preferred_language"),
    linkedinUrl: text("linkedin_url"),
    twitterUrl: text("twitter_url"),
    leadScore: integer("lead_score").default(0),
    sentimentScore: real("sentiment_score"),
    status: contactStatusEnum("status").default("active"),
    source: leadSourceEnum("source"),
    assignedToId: text("assigned_to_id").references(() => users.id, {
      onDelete: "set null",
    }),
    lastInteractionAt: timestamp("last_interaction_at"),
    aiSummary: text("ai_summary"),
    notes: text("notes"),
    tags: text("tags").array().default([]),
    customFields: text("custom_fields"), // JSON string
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("contacts_org_idx").on(t.organizationId),
    index("contacts_company_idx").on(t.companyId),
    index("contacts_email_idx").on(t.email),
    index("contacts_assignee_idx").on(t.assignedToId),
  ]
);

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;