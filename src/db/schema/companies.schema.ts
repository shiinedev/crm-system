import {
    pgTable,
    pgEnum,
    text,
    timestamp,
    numeric,
    real,
    index,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { organizations, users } from "./auth.schema";

export const lifecycleStageEnum = pgEnum("lifecycle_stage", [
    "lead",
    "prospect",
    "opportunity",
    "customer",
    "churned",
]);

export const leadStatusEnum = pgEnum("lead_status", [
    "new",
    "open",
    "in_progress",
    "unqualified",
    "disqualified",
]);

export const leadSourceEnum = pgEnum("lead_source", [
    "website",
    "referral",
    "cold_outreach",
    "event",
    "social_media",
    "paid_ads",
    "other",
]);

export const riskLevelEnum = pgEnum("risk_level", [
    "low",
    "medium",
    "high",
    "critical",
]);

export const companies = pgTable(
    "companies",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => createId()),
        organizationId: text("organization_id")
            .notNull()
            .references(() => organizations.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        slug: text("slug").notNull(),
        logo: text("logo"),
        website: text("website"),
        linkedinUrl: text("linkedin_url"),
        industry: text("industry"),
        companySize: text("company_size"),
        annualRevenue: numeric("annual_revenue"),
        country: text("country"),
        city: text("city"),
        address: text("address"),
        timezone: text("timezone"),
        lifecycleStage: lifecycleStageEnum("lifecycle_stage").default("lead"),
        leadStatus: leadStatusEnum("lead_status"),
        leadSource: leadSourceEnum("lead_source"),
        assignedOwnerId: text("assigned_owner_id").references(() => users.id, {
            onDelete: "set null",
        }),
        tags: text("tags").array().default([]),
        riskLevel: riskLevelEnum("risk_level"),
        churnProbability: real("churn_probability"),
        aiSummary: text("ai_summary"),
        aiInsights: text("ai_insights"), // JSON string
        notes: text("notes"),
        metadata: text("metadata"), // JSON string
        deletedAt: timestamp("deleted_at"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (t) => [
        index("companies_org_idx").on(t.organizationId),
        uniqueIndex("companies_slug_org_idx").on(t.slug, t.organizationId),
        index("companies_owner_idx").on(t.assignedOwnerId),
    ]
);

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;