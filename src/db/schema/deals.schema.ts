import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  integer,
  boolean,
  numeric,
  date,
  index,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { organizations, users } from "./auth.schema";
import { companies, riskLevelEnum } from "./companies.schema";
import { contacts } from "./contacts.schema";

export const priorityEnum = pgEnum("priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const forecastCategoryEnum = pgEnum("forecast_category", [
  "pipeline",
  "best_case",
  "commit",
  "closed_won",
  "closed_lost",
  "omitted",
]);

export const pipelines = pgTable(
  "pipelines",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    isDefault: boolean("is_default").default(false),
    currency: text("currency").default("USD"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("pipelines_org_idx").on(t.organizationId)]
);

export const pipelineStages = pgTable("pipeline_stages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  pipelineId: text("pipeline_id")
    .notNull()
    .references(() => pipelines.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  order: integer("order").notNull(),
  probability: integer("probability").default(0),
  color: text("color"),
  isWon: boolean("is_won").default(false),
  isLost: boolean("is_lost").default(false),
});

export const deals = pgTable(
  "deals",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    value: numeric("value"),
    currency: text("currency").default("USD"),
    probability: integer("probability"),
    pipelineId: text("pipeline_id")
      .notNull()
      .references(() => pipelines.id),
    stageId: text("stage_id")
      .notNull()
      .references(() => pipelineStages.id),
    expectedCloseDate: date("expected_close_date"),
    actualCloseDate: date("actual_close_date"),
    dealSource: text("deal_source"),
    competitors: text("competitors").array().default([]),
    priority: priorityEnum("priority").default("medium"),
    riskLevel: riskLevelEnum("risk_level"),
    contractLength: text("contract_length"),
    paymentTerms: text("payment_terms"),
    forecastCategory: forecastCategoryEnum("forecast_category"),
    aiRiskAnalysis: text("ai_risk_analysis"),
    aiNextAction: text("ai_next_action"),
    aiSummary: text("ai_summary"),
    ownerId: text("owner_id").references(() => users.id, {
      onDelete: "set null",
    }),
    companyId: text("company_id").references(() => companies.id, {
      onDelete: "set null",
    }),
    contactId: text("contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),
    metadata: text("metadata"), // JSON string
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("deals_org_idx").on(t.organizationId),
    index("deals_stage_idx").on(t.stageId),
    index("deals_owner_idx").on(t.ownerId),
    index("deals_company_idx").on(t.companyId),
    index("deals_pipeline_idx").on(t.pipelineId),
  ]
);

export type Pipeline = typeof pipelines.$inferSelect;
export type NewPipeline = typeof pipelines.$inferInsert;
export type PipelineStage = typeof pipelineStages.$inferSelect;
export type NewPipelineStage = typeof pipelineStages.$inferInsert;
export type Deal = typeof deals.$inferSelect;
export type NewDeal = typeof deals.$inferInsert;