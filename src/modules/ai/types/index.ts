/**
 * Typed definitions for every CRM tool the AI agent can call.
 *
 * Pattern from the official AI Elements docs:
 *   type MyToolUIPart = ToolUIPart<{ toolName: { input: In; output: Out } }>
 *
 * Each input/output mirrors what tools.ts actually passes to / returns from
 * each tool's execute() function — derived from the DB schema types.
 */

import type { ToolUIPart } from "ai"
import type { Company, Contact, Deal, Task, Activity } from "@/db/schema"

// ─── Scalar aliases from schema enums

export type LifecycleStage = NonNullable<Company["lifecycleStage"]>
export type RiskLevel      = NonNullable<Company["riskLevel"]>
export type Priority       = NonNullable<Deal["priority"]>
export type TaskStatus     = NonNullable<Task["status"]>
export type ContactStatus  = NonNullable<Contact["status"]>

// ─── Per-tool input shapes (what the AI passes in) ───────────────────────────

export type GetDashboardSummaryInput  = Record<string, never>
export type ListCompaniesInput        = Record<string, never>
export type GetCompanyInput           = { id: string }
export type ListContactsInput         = Record<string, never>
export type GetContactInput           = { id: string }
export type ListDealsInput            = Record<string, never>
export type GetDealInput              = { id: string }
export type GetDealStatsInput         = Record<string, never>
export type ListOpenTasksInput        = Record<string, never>
export type RecentActivityInput       = { limit?: number }
export type SearchDocumentsInput      = { query: string }

//Per-tool output shapes (what execute() returns)

export interface DashboardSummaryOutput {
  companies: number
  contacts:  number
  deals:     number
  dealValue: number
  openTasks: number
}

/** Mapped subset returned by listCompanies */
export interface CompanyListItem
  extends Pick<Company, "id" | "name" | "industry" | "lifecycleStage" | "city"> {}

/** Full Company row returned by getCompany */
export type CompanyDetailOutput = Company

/** Mapped subset returned by listContacts */
export interface ContactListItem
  extends Pick<Contact, "id" | "firstName" | "lastName" | "email" | "title" | "leadScore"> {}

/** Full Contact row returned by getContact */
export type ContactDetailOutput = Contact

/** Mapped subset returned by listDeals */
export interface DealListItem
  extends Pick<Deal, "id" | "title" | "value" | "probability" | "priority" | "expectedCloseDate"> {}

/** Full Deal row returned by getDeal */
export type DealDetailOutput = Deal

export interface DealStatsOutput {
  totalDeals:     number
  totalValue:     number
  avgProbability: number
}

/** Mapped subset returned by listOpenTasks */
export interface TaskListItem
  extends Pick<Task, "id" | "title" | "priority" | "dueDate" | "status"> {}

/** Full Activity row returned by recentActivity */
export type ActivityItem = Activity

/** Mapped output returned by searchDocuments (from retrieval.ts searchSimilar) */
export interface DocumentSearchResult {
  documentId: string
  title:      string | undefined
  relevance:  number
}

// CRM tools map — the single source of truth for all tool types

export type CrmToolsMap = {
  getDashboardSummary: { input: GetDashboardSummaryInput; output: DashboardSummaryOutput }
  listCompanies:       { input: ListCompaniesInput;       output: CompanyListItem[] }
  getCompany:          { input: GetCompanyInput;          output: CompanyDetailOutput | null }
  listContacts:        { input: ListContactsInput;        output: ContactListItem[] }
  getContact:          { input: GetContactInput;          output: ContactDetailOutput | null }
  listDeals:           { input: ListDealsInput;           output: DealListItem[] }
  getDeal:             { input: GetDealInput;             output: DealDetailOutput | null }
  getDealStats:        { input: GetDealStatsInput;        output: DealStatsOutput }
  listOpenTasks:       { input: ListOpenTasksInput;       output: TaskListItem[] }
  recentActivity:      { input: RecentActivityInput;      output: ActivityItem[] }
  searchDocuments:     { input: SearchDocumentsInput;     output: DocumentSearchResult[] }
}

/** Fully typed union of all CRM tool UI parts — use this in the chat panel */
export type CrmToolUIPart = ToolUIPart<CrmToolsMap>

/** The state union from ToolUIPart */
export type ToolState = CrmToolUIPart["state"]

/** Human-readable label for each tool */
export const TOOL_LABELS: Record<keyof CrmToolsMap, string> = {
  getDashboardSummary: "Dashboard summary",
  listCompanies:       "Companies",
  getCompany:          "Company details",
  listContacts:        "Contacts",
  getContact:          "Contact details",
  listDeals:           "Deals",
  getDeal:             "Deal details",
  getDealStats:        "Deal statistics",
  listOpenTasks:       "Open tasks",
  recentActivity:      "Recent activity",
  searchDocuments:     "Searching notes",
}
