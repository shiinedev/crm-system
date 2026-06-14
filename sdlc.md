# AI-Powered CRM SaaS — System Design (SDLC)

> Stack: Next.js 15 · TypeScript · tRPC · better-auth · Drizzle ORM · Neon · Tailwind · shadcn/ui · Vercel AI SDK · Inngest · Upstash Redis · Pinecone

---

## Phase 1 — Requirements Analysis

### 1.1 Functional Requirements

| Domain | Requirements |
|---|---|
| Auth | Email/password, OAuth, MFA, org switching, invite flow |
| Multi-tenancy | Organization isolation, RBAC (6 roles), member management |
| CRM Core | Companies, Contacts, Deals with full field sets |
| Pipelines | Customizable stages, kanban, win/loss tracking |
| Activities | Unified timeline: calls, emails, notes, tasks, status changes |
| AI | Lead scoring, deal risk, email gen, summaries, chatbot, agent |
| Automation | Trigger → Condition → Action engine (Inngest-backed) |
| Documents | File upload, Markdown notes, versioning, semantic search |
| Analytics | Revenue forecast, pipeline health, team performance charts |
| Notifications | In-app, email, realtime, mentions, reminders |
| Search | Global fuzzy + semantic AI search |
| Integrations | Gmail, GCal, Slack, Stripe, Zoom (MCP-compatible) |
| Realtime | Live updates, presence, collaborative editing |

### 1.2 Non-Functional Requirements

| Concern | Target |
|---|---|
| Multi-tenant isolation | Row-level org scoping on every query |
| Performance | < 200ms p95 API response; streaming AI |
| Scalability | Stateless API + Neon connection pooling |
| Security | JWT sessions, CSRF, rate-limiting, audit logs |
| Observability | Structured logging, error tracking |

### 1.3 RBAC Matrix

| Permission | owner | admin | manager | sales_rep | support_agent | viewer |
|---|---|---|---|---|---|---|
| Manage org settings | ✓ | ✓ | — | — | — | — |
| Invite/remove members | ✓ | ✓ | — | — | — | — |
| Delete records | ✓ | ✓ | — | — | — | — |
| Create/edit records | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| View all records | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Run automation | ✓ | ✓ | ✓ | — | — | — |
| View analytics | ✓ | ✓ | ✓ | ✓ | — | ✓ |

---

## Phase 2 — System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│   Next.js App Router (RSC + Client Components)              │
│   TanStack Query · Zustand · nuqs · shadcn/ui               │
└────────────────────────┬────────────────────────────────────┘
                         │ tRPC over HTTP / Server Actions
┌────────────────────────▼────────────────────────────────────┐
│                      API / BFF LAYER                        │
│   tRPC Routers · next-safe-action · better-auth             │
│   Middleware: auth check · org isolation · rate limit       │
└──────┬──────────────────┬────────────────────┬─────────────┘
       │                  │                    │
┌──────▼──────┐  ┌────────▼────────┐  ┌───────▼───────────┐
│  Neon (PG)  │  │  Upstash Redis  │  │  Inngest          │
│  Drizzle    │  │  Cache · Queues │  │  Background Jobs  │
│  ORM        │  │  Sessions       │  │  Automation Engine│
└─────────────┘  └─────────────────┘  └───────────────────┘
       │                                        │
┌──────▼──────────────────────────────────────▼─────────────┐
│                      AI LAYER                              │
│   Vercel AI SDK · OpenAI · Pinecone (vectors)              │
│   RAG pipeline · Streaming · Agent framework               │
└────────────────────────────────────────────────────────────┘
       │
┌──────▼──────┐
│  Cloudflare │  Edge: auth middleware, asset caching
│  Vercel     │  Hosting, Edge Functions
└─────────────┘
```

### 2.2 Data Flow — Request Lifecycle

```
Browser → Next.js Middleware (auth cookie check)
       → RSC fetch via tRPC server caller
       → tRPC Router (org-scoped Drizzle query)
       → Neon (row-level WHERE organizationId = ?)
       → Response (streamed or JSON)
       → TanStack Query cache hydration
```

### 2.3 Multi-Tenancy Strategy

- Every table carries `organization_id` (FK, indexed).
- All tRPC procedures extract `organizationId` from the session — never from the request body.
- Drizzle queries always filter by `organizationId` at the query layer, not the application layer.
- Row-level isolation enforced via a `withOrg(ctx)` helper that wraps every query.

### 2.4 AI Architecture

```
User Request
    │
    ▼
AI Router (tRPC)
    │
    ├── Simple Generation → OpenAI Chat (streaming via Vercel AI SDK)
    │
    ├── RAG Queries → Pinecone vector search → retrieve chunks
    │               → inject into system prompt → OpenAI
    │
    └── Agent Tasks → Tool definitions (read-CRM, search-docs, draft-email)
                    → LLM selects tools → execute → loop until done
                    → Inngest for background agent runs
```

### 2.5 Automation Engine (Inngest)

```
Trigger Event (deal.stage.changed)
    │
    ▼
Inngest Function
    ├── Evaluate Conditions (deal.value > 10000)
    └── Execute Actions
            ├── send_email
            ├── create_task
            ├── notify_slack
            └── ai_generate_summary
```

---

## Phase 3 — Database Design

### 3.1 Entity Relationship Overview

```
organization ──< organization_member
     │
     ├──< company
     │       └──< contact
     │               └──< deal
     │
     ├──< pipeline ──< pipeline_stage ──< deal
     │
     ├──< activity (polymorphic: companyId | contactId | dealId)
     ├──< task
     ├──< document
     ├──< notification
     ├──< automation_workflow
     └──< audit_log
```

### 3.2 Drizzle Schema

```typescript
// ─── Auth (better-auth managed) ───────────────────────────
// tables: user, session, account, verification
// tables: organization, organization_member, invitation

// ─── companies ────────────────────────────────────────────
export const companies = pgTable("companies", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  organizationId: text("organization_id").notNull()
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
  assignedOwnerId: text("assigned_owner_id")
    .references(() => users.id, { onDelete: "set null" }),
  tags: text("tags").array().default([]),
  riskLevel: riskLevelEnum("risk_level"),
  churnProbability: real("churn_probability"),
  aiSummary: text("ai_summary"),
  aiInsights: jsonb("ai_insights"),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  orgIdx: index("companies_org_idx").on(t.organizationId),
  slugIdx: uniqueIndex("companies_slug_org_idx").on(t.slug, t.organizationId),
}));

// ─── contacts ─────────────────────────────────────────────
export const contacts = pgTable("contacts", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  organizationId: text("organization_id").notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  companyId: text("company_id")
    .references(() => companies.id, { onDelete: "set null" }),
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
  assignedToId: text("assigned_to_id")
    .references(() => users.id, { onDelete: "set null" }),
  lastInteractionAt: timestamp("last_interaction_at"),
  aiSummary: text("ai_summary"),
  notes: text("notes"),
  tags: text("tags").array().default([]),
  customFields: jsonb("custom_fields"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  orgIdx: index("contacts_org_idx").on(t.organizationId),
  emailIdx: index("contacts_email_idx").on(t.email),
  companyIdx: index("contacts_company_idx").on(t.companyId),
}));

// ─── pipelines ────────────────────────────────────────────
export const pipelines = pgTable("pipelines", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  organizationId: text("organization_id").notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  isDefault: boolean("is_default").default(false),
  currency: text("currency").default("USD"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  orgIdx: index("pipelines_org_idx").on(t.organizationId),
}));

export const pipelineStages = pgTable("pipeline_stages", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  pipelineId: text("pipeline_id").notNull()
    .references(() => pipelines.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  order: integer("order").notNull(),
  probability: integer("probability").default(0),
  color: text("color"),
  isWon: boolean("is_won").default(false),
  isLost: boolean("is_lost").default(false),
});

// ─── deals ────────────────────────────────────────────────
export const deals = pgTable("deals", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  organizationId: text("organization_id").notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  value: numeric("value"),
  currency: text("currency").default("USD"),
  probability: integer("probability"),
  pipelineId: text("pipeline_id").notNull()
    .references(() => pipelines.id),
  stageId: text("stage_id").notNull()
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
  ownerId: text("owner_id")
    .references(() => users.id, { onDelete: "set null" }),
  companyId: text("company_id")
    .references(() => companies.id, { onDelete: "set null" }),
  contactId: text("contact_id")
    .references(() => contacts.id, { onDelete: "set null" }),
  metadata: jsonb("metadata"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  orgIdx: index("deals_org_idx").on(t.organizationId),
  stageIdx: index("deals_stage_idx").on(t.stageId),
  ownerIdx: index("deals_owner_idx").on(t.ownerId),
}));

// ─── activities ───────────────────────────────────────────
export const activities = pgTable("activities", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  organizationId: text("organization_id").notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  type: activityTypeEnum("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  metadata: jsonb("metadata"),
  // Polymorphic relations
  companyId: text("company_id").references(() => companies.id, { onDelete: "cascade" }),
  contactId: text("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
  dealId: text("deal_id").references(() => deals.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  orgIdx: index("activities_org_idx").on(t.organizationId),
  dealIdx: index("activities_deal_idx").on(t.dealId),
  companyIdx: index("activities_company_idx").on(t.companyId),
}));

// ─── tasks ────────────────────────────────────────────────
export const tasks = pgTable("tasks", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  organizationId: text("organization_id").notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  priority: priorityEnum("priority").default("medium"),
  status: taskStatusEnum("status").default("todo"),
  dueDate: timestamp("due_date"),
  reminderAt: timestamp("reminder_at"),
  assignedToId: text("assigned_to_id")
    .references(() => users.id, { onDelete: "set null" }),
  dealId: text("deal_id").references(() => deals.id, { onDelete: "set null" }),
  companyId: text("company_id").references(() => companies.id, { onDelete: "set null" }),
  contactId: text("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  recurrenceRule: text("recurrence_rule"),
  aiSuggested: boolean("ai_suggested").default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  orgIdx: index("tasks_org_idx").on(t.organizationId),
  assigneeIdx: index("tasks_assignee_idx").on(t.assignedToId),
}));

// ─── documents ────────────────────────────────────────────
export const documents = pgTable("documents", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  organizationId: text("organization_id").notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content"),       // Markdown
  fileUrl: text("file_url"),      // Uploaded file
  mimeType: text("mime_type"),
  embeddingId: text("embedding_id"), // Pinecone vector ID
  version: integer("version").default(1),
  uploadedById: text("uploaded_by_id")
    .references(() => users.id, { onDelete: "set null" }),
  companyId: text("company_id").references(() => companies.id, { onDelete: "set null" }),
  dealId: text("deal_id").references(() => deals.id, { onDelete: "set null" }),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  orgIdx: index("documents_org_idx").on(t.organizationId),
}));

// ─── notifications ────────────────────────────────────────
export const notifications = pgTable("notifications", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  organizationId: text("organization_id").notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  metadata: jsonb("metadata"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("notifications_user_idx").on(t.userId),
  unreadIdx: index("notifications_unread_idx").on(t.userId, t.readAt),
}));

// ─── automation_workflows ─────────────────────────────────
export const automationWorkflows = pgTable("automation_workflows", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  organizationId: text("organization_id").notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true),
  trigger: jsonb("trigger").notNull(),    // { type, config }
  conditions: jsonb("conditions"),        // []
  actions: jsonb("actions").notNull(),    // [{ type, config }]
  runCount: integer("run_count").default(0),
  lastRunAt: timestamp("last_run_at"),
  createdById: text("created_by_id")
    .references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  orgIdx: index("workflows_org_idx").on(t.organizationId),
}));

// ─── audit_logs ───────────────────────────────────────────
export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  organizationId: text("organization_id").notNull(),
  userId: text("user_id"),
  action: text("action").notNull(),     // "company.created", "deal.stage.changed"
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  before: jsonb("before"),
  after: jsonb("after"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  orgIdx: index("audit_logs_org_idx").on(t.organizationId),
  resourceIdx: index("audit_logs_resource_idx").on(t.resourceType, t.resourceId),
}));

// ─── Enums ────────────────────────────────────────────────
export const lifecycleStageEnum = pgEnum("lifecycle_stage", [
  "lead", "prospect", "opportunity", "customer", "churned"
]);
export const leadStatusEnum = pgEnum("lead_status", [
  "new", "open", "in_progress", "unqualified", "disqualified"
]);
export const leadSourceEnum = pgEnum("lead_source", [
  "website", "referral", "cold_outreach", "event", "social_media", "paid_ads", "other"
]);
export const riskLevelEnum = pgEnum("risk_level", ["low", "medium", "high", "critical"]);
export const contactStatusEnum = pgEnum("contact_status", ["active", "inactive", "bounced"]);
export const priorityEnum = pgEnum("priority", ["low", "medium", "high", "urgent"]);
export const forecastCategoryEnum = pgEnum("forecast_category", [
  "pipeline", "best_case", "commit", "closed_won", "closed_lost", "omitted"
]);
export const activityTypeEnum = pgEnum("activity_type", [
  "call", "meeting", "email", "note", "task", "status_change", "document_upload", "comment"
]);
export const taskStatusEnum = pgEnum("task_status", ["todo", "in_progress", "done", "cancelled"]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "mention", "assignment", "deal_update", "task_due", "ai_insight", "workflow_run", "system"
]);
```

---

## Phase 4 — API Design (tRPC Routers)

```
appRouter
├── auth          → session, me, updateProfile
├── organizations → create, update, members, invite, switchOrg
├── companies     → list, get, create, update, delete, aiAnalyze
├── contacts      → list, get, create, update, delete, merge
├── deals         → list, get, create, update, delete, changeStage
├── pipelines     → list, get, create, update, stages
├── activities    → list (timeline), create, delete
├── tasks         → list, get, create, update, delete, myTasks
├── documents     → list, upload, createNote, delete, semanticSearch
├── notifications → list, markRead, markAllRead
├── analytics     → revenueByMonth, pipelineHealth, teamPerformance, forecast
├── search        → global (fuzzy + semantic)
├── automation    → list, create, update, delete, toggle, testRun
└── ai
    ├── chat          → streaming chatbot
    ├── generateEmail → draft email for contact/deal
    ├── scoreLead     → update contact leadScore
    ├── analyzeDeal   → risk + next action
    ├── summarize     → meeting/activity summary
    ├── researchCompany → web-augmented company insights
    └── agent         → background agent runner
```

### Procedure Pattern (all mutations)

Every mutation goes through next-safe-action with:
1. Zod input validation
2. Auth session check
3. Org membership check
4. Permission level check
5. Business logic
6. Audit log write
7. Inngest event emit (for automation triggers)

---

## Phase 5 — Folder Structure

```
/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Public auth pages
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── invite/[token]/page.tsx
│   │   │
│   │   ├── (app)/                    # Protected app shell
│   │   │   ├── layout.tsx            # App shell: sidebar, header
│   │   │   ├── page.tsx              # /dashboard redirect
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── companies/
│   │   │   │   ├── page.tsx          # Company list
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # Company detail
│   │   │   │       ├── contacts/page.tsx
│   │   │   │       ├── deals/page.tsx
│   │   │   │       └── activity/page.tsx
│   │   │   │
│   │   │   ├── contacts/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   │
│   │   │   ├── deals/
│   │   │   │   ├── page.tsx          # Kanban board
│   │   │   │   └── [id]/page.tsx
│   │   │   │
│   │   │   ├── tasks/
│   │   │   │   └── page.tsx          # Kanban + Calendar toggle
│   │   │   │
│   │   │   ├── documents/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   │
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── automation/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   │
│   │   │   ├── settings/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── organization/page.tsx
│   │   │   │   ├── members/page.tsx
│   │   │   │   ├── billing/page.tsx
│   │   │   │   ├── integrations/page.tsx
│   │   │   │   └── profile/page.tsx
│   │   │   │
│   │   │   └── ai/
│   │   │       └── chat/page.tsx     # AI assistant
│   │   │
│   │   └── api/
│   │       ├── trpc/[trpc]/route.ts
│   │       ├── auth/[...all]/route.ts   # better-auth handler
│   │       ├── ai/chat/route.ts          # Vercel AI SDK streaming
│   │       ├── webhooks/
│   │       │   ├── stripe/route.ts
│   │       │   └── inngest/route.ts
│   │       └── uploads/route.ts
│   │
│   ├── modules/                       # Feature modules (DDD)
│   │   ├── companies/
│   │   │   ├── components/
│   │   │   │   ├── CompanyTable.tsx
│   │   │   │   ├── CompanyCard.tsx
│   │   │   │   ├── CompanyForm.tsx
│   │   │   │   ├── CompanyDetail.tsx
│   │   │   │   └── CompanyFilters.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useCompanies.ts
│   │   │   │   └── useCompanyDetail.ts
│   │   │   ├── schemas/
│   │   │   │   └── company.schema.ts
│   │   │   └── types/
│   │   │       └── company.types.ts
│   │   │
│   │   ├── contacts/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── schemas/
│   │   │
│   │   ├── deals/
│   │   │   ├── components/
│   │   │   │   ├── DealKanban.tsx
│   │   │   │   ├── DealCard.tsx
│   │   │   │   ├── DealForm.tsx
│   │   │   │   ├── DealDetail.tsx
│   │   │   │   └── DealStageColumn.tsx
│   │   │   ├── hooks/
│   │   │   └── schemas/
│   │   │
│   │   ├── pipelines/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   │
│   │   ├── activities/
│   │   │   ├── components/
│   │   │   │   ├── ActivityTimeline.tsx
│   │   │   │   ├── ActivityItem.tsx
│   │   │   │   └── ActivityForm.tsx
│   │   │   └── hooks/
│   │   │
│   │   ├── tasks/
│   │   │   ├── components/
│   │   │   │   ├── TaskKanban.tsx
│   │   │   │   ├── TaskCalendar.tsx
│   │   │   │   └── TaskCard.tsx
│   │   │   └── hooks/
│   │   │
│   │   ├── documents/
│   │   │   ├── components/
│   │   │   │   ├── DocumentList.tsx
│   │   │   │   ├── MarkdownEditor.tsx
│   │   │   │   └── FileUpload.tsx
│   │   │   └── hooks/
│   │   │
│   │   ├── analytics/
│   │   │   ├── components/
│   │   │   │   ├── RevenueChart.tsx
│   │   │   │   ├── PipelineHealth.tsx
│   │   │   │   ├── FunnelChart.tsx
│   │   │   │   └── TeamPerformance.tsx
│   │   │   └── hooks/
│   │   │
│   │   ├── notifications/
│   │   │   ├── components/
│   │   │   │   ├── NotificationBell.tsx
│   │   │   │   └── NotificationList.tsx
│   │   │   └── hooks/
│   │   │
│   │   ├── automation/
│   │   │   ├── components/
│   │   │   │   ├── WorkflowBuilder.tsx
│   │   │   │   ├── TriggerSelector.tsx
│   │   │   │   ├── ConditionBuilder.tsx
│   │   │   │   └── ActionBuilder.tsx
│   │   │   └── hooks/
│   │   │
│   │   ├── search/
│   │   │   ├── components/
│   │   │   │   ├── CommandPalette.tsx
│   │   │   │   └── SearchResults.tsx
│   │   │   └── hooks/
│   │   │       └── useSearch.ts
│   │   │
│   │   └── ai/
│   │       ├── components/
│   │       │   ├── AIChatPanel.tsx
│   │       │   ├── AIInsightCard.tsx
│   │       │   └── AIActionButton.tsx
│   │       ├── agent/
│   │       │   ├── tools.ts           # CRM read/write tools
│   │       │   ├── runner.ts          # Agent loop
│   │       │   └── memory.ts          # Upstash-backed memory
│   │       └── rag/
│   │           ├── embeddings.ts
│   │           ├── index.ts           # Pinecone ops
│   │           └── retrieval.ts
│   │
│   ├── server/                        # Server-only
│   │   ├── trpc/
│   │   │   ├── context.ts             # { session, orgId, db }
│   │   │   ├── trpc.ts                # base procedures + middleware
│   │   │   ├── root.ts                # appRouter assembly
│   │   │   └── routers/
│   │   │       ├── auth.router.ts
│   │   │       ├── organizations.router.ts
│   │   │       ├── companies.router.ts
│   │   │       ├── contacts.router.ts
│   │   │       ├── deals.router.ts
│   │   │       ├── pipelines.router.ts
│   │   │       ├── activities.router.ts
│   │   │       ├── tasks.router.ts
│   │   │       ├── documents.router.ts
│   │   │       ├── notifications.router.ts
│   │   │       ├── analytics.router.ts
│   │   │       ├── search.router.ts
│   │   │       ├── automation.router.ts
│   │   │       └── ai.router.ts
│   │   │
│   │   ├── db/
│   │   │   ├── index.ts               # Drizzle client (Neon)
│   │   │   ├── schema/
│   │   │   │   ├── index.ts           # re-exports all
│   │   │   │   ├── auth.schema.ts     # better-auth tables
│   │   │   │   ├── companies.schema.ts
│   │   │   │   ├── contacts.schema.ts
│   │   │   │   ├── deals.schema.ts
│   │   │   │   ├── pipelines.schema.ts
│   │   │   │   ├── activities.schema.ts
│   │   │   │   ├── tasks.schema.ts
│   │   │   │   ├── documents.schema.ts
│   │   │   │   ├── notifications.schema.ts
│   │   │   │   ├── automation.schema.ts
│   │   │   │   └── audit.schema.ts
│   │   │   └── migrations/
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.ts                # better-auth config
│   │   │   └── auth-client.ts         # client-side auth
│   │   │
│   │   ├── actions/                   # next-safe-action
│   │   │   ├── safe-action.ts         # base client
│   │   │   ├── companies.actions.ts
│   │   │   ├── contacts.actions.ts
│   │   │   ├── deals.actions.ts
│   │   │   └── tasks.actions.ts
│   │   │
│   │   ├── inngest/
│   │   │   ├── client.ts
│   │   │   └── functions/
│   │   │       ├── automation-runner.ts
│   │   │       ├── email-sender.ts
│   │   │       ├── ai-enrichment.ts
│   │   │       ├── notification-dispatch.ts
│   │   │       └── lead-scorer.ts
│   │   │
│   │   └── cache/
│   │       ├── redis.ts               # Upstash client
│   │       └── keys.ts                # cache key constants
│   │
│   ├── components/                    # Global shared UI
│   │   ├── ui/                        # shadcn/ui re-exports
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── OrgSwitcher.tsx
│   │   │   └── UserMenu.tsx
│   │   ├── data-table/
│   │   │   ├── DataTable.tsx
│   │   │   ├── DataTableToolbar.tsx
│   │   │   ├── DataTableFilters.tsx
│   │   │   └── DataTablePagination.tsx
│   │   ├── forms/
│   │   │   ├── FormField.tsx
│   │   │   └── ComboboxField.tsx
│   │   └── shared/
│   │       ├── EmptyState.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── AvatarGroup.tsx
│   │       ├── PriorityBadge.tsx
│   │       ├── StatusBadge.tsx
│   │       └── RelativeTime.tsx
│   │
│   ├── lib/                           # Pure utilities
│   │   ├── trpc/
│   │   │   ├── client.tsx             # TanStack Query provider
│   │   │   └── server.ts              # RSC caller
│   │   ├── utils.ts                   # cn(), formatCurrency, etc.
│   │   ├── constants.ts
│   │   └── validators/                # Shared Zod schemas
│   │
│   ├── hooks/                         # Global hooks
│   │   ├── useOrg.ts
│   │   ├── usePermissions.ts
│   │   ├── useCommandPalette.ts
│   │   └── useRealtimeChannel.ts
│   │
│   ├── stores/                        # Zustand stores
│   │   ├── ui.store.ts                # sidebar, modals, drawer
│   │   ├── command.store.ts
│   │   └── ai-chat.store.ts
│   │
│   ├── styles/
│   │   └── globals.css
│   │
│   └── middleware.ts                  # Auth gate + org resolution
│
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Phase 6 — Key Architectural Decisions

### 6.1 tRPC Context Shape

```typescript
// Every procedure receives this context
type TRPCContext = {
  session: Session | null;
  user: User | null;
  orgId: string | null;            // Active organization
  orgMember: OrgMember | null;     // Contains role
  db: DrizzleClient;
  redis: RedisClient;
  headers: Headers;
}
```

### 6.2 Auth Middleware Strategy

```typescript
// middleware.ts — edge-safe
export async function middleware(req: NextRequest) {
  const sessionCookie = req.cookies.get("session");

  // Public routes: allow
  if (isPublicRoute(req.pathname)) return NextResponse.next();

  // No session: redirect to login
  if (!sessionCookie) return NextResponse.redirect("/login");

  // Org-scoped routes: resolve active org from cookie or DB
  // Heavy session work done in RSC, not middleware
  return NextResponse.next();
}
```

### 6.3 Permission Guard Pattern

```typescript
// Base protected procedure
export const orgProcedure = publicProcedure
  .use(({ ctx, next }) => {
    if (!ctx.session) throw new TRPCError({ code: "UNAUTHORIZED" });
    if (!ctx.orgMember) throw new TRPCError({ code: "FORBIDDEN" });
    return next({ ctx: { ...ctx, user: ctx.user!, orgMember: ctx.orgMember! } });
  });

// Role-specific procedures
export const managerProcedure = orgProcedure
  .use(requireRole(["owner", "admin", "manager"]));

export const adminProcedure = orgProcedure
  .use(requireRole(["owner", "admin"]));
```

### 6.4 Org Query Scoping

```typescript
// withOrg helper — used in every router
function withOrg(db: DrizzleClient, orgId: string) {
  return {
    companies: () => db.select().from(companies).where(eq(companies.organizationId, orgId)),
    deals: () => db.select().from(deals).where(eq(deals.organizationId, orgId)),
    // ...etc
  };
}
```

### 6.5 Inngest Event Naming

```
crm/deal.stage.changed
crm/contact.created
crm/meeting.ended
crm/lead.scored
crm/automation.trigger
crm/document.uploaded
crm/task.due
```

---

## Phase 7 — Implementation Roadmap

### Sprint 1 — Foundation (Week 1–2)
- [ ] Monorepo + Next.js 15 setup with `/src`
- [ ] Neon DB + Drizzle schema + migrations
- [ ] better-auth: email/password, OAuth, org plugin
- [ ] tRPC setup: context, router, client
- [ ] next-safe-action base client
- [ ] App shell UI: sidebar, header, org-switcher
- [ ] Auth pages: login, register, invite

### Sprint 2 — CRM Core (Week 3–4)
- [ ] Companies: CRUD, table, detail page, filters
- [ ] Contacts: CRUD, table, detail, link to company
- [ ] Deals: CRUD, kanban board, drag-and-drop stages
- [ ] Pipelines: create/edit, stage management
- [ ] Activities: timeline, create note/call/email
- [ ] Tasks: kanban board, assignments, due dates

### Sprint 3 — AI Layer (Week 5–6)
- [ ] Vercel AI SDK streaming chat
- [ ] AI email generation
- [ ] Lead scoring (OpenAI + Inngest)
- [ ] Deal risk analysis
- [ ] Pinecone embeddings + RAG for documents
- [ ] AI agent framework: tools + runner

### Sprint 4 — Automation & Analytics (Week 7–8)
- [ ] Inngest automation engine
- [ ] Workflow builder UI
- [ ] Analytics dashboard: revenue, pipeline, team
- [ ] Recharts integration
- [ ] Notifications system (in-app + realtime)
- [ ] Global search: fuzzy + semantic

### Sprint 5 — Polish & Integrations (Week 9–10)
- [ ] Command palette (⌘K)
- [ ] Keyboard shortcuts
- [ ] Dark mode
- [ ] Gmail / Google Calendar integration
- [ ] Slack notifications
- [ ] Document versioning
- [ ] Audit logs UI
- [ ] Production hardening: rate limits, error tracking

---

## Phase 8 — Production Checklist

| Category | Item |
|---|---|
| Security | JWT secret rotation, CSRF tokens, CSP headers |
| Database | Connection pooling (Neon serverless driver), indexes on all FK columns |
| Caching | Redis for session data, org membership, frequently read lists |
| AI | Rate limiting per org on OpenAI calls, cost tracking |
| Observability | Structured logs, Sentry error tracking, Vercel analytics |
| Scaling | Stateless API, Inngest for all async work, no long-running requests |
| Backup | Neon point-in-time recovery, daily backups |
| Compliance | Soft deletes on all user data, audit logs retained 90 days |