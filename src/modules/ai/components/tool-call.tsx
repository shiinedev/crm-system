"use client"

/**
 * Per-tool output UI — fully typed, zero `any`.
 *
 * Types come from crm-tool-types.ts which derives them directly from
 * the DB schema ($inferSelect) and AI SDK's ToolUIPart<T> generic.
 */

import Link from "next/link"
import {
  Building2, Users, TrendingUp, CheckSquare, Activity,
  BarChart3, FileText, DollarSign, Star,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {  formatRelativeTime } from "@/utils/format-date"
import { formatCurrency } from "@/utils/format-currency"
import type {
  CrmToolUIPart,
  CrmToolsMap,
  DashboardSummaryOutput,
  CompanyListItem,
  CompanyDetailOutput,
  ContactListItem,
  ContactDetailOutput,
  DealListItem,
  DealDetailOutput,
  DealStatsOutput,
  TaskListItem,
  ActivityItem,
  DocumentSearchResult,
  Priority,
  TOOL_LABELS,
} from "../types"
import { TOOL_LABELS as LABELS } from "../types"

// Shared primitives

function MiniCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: React.ElementType
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold truncate">{value}</p>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground py-2">{message}</p>
}

const PRIORITY_DOT: Record<Priority, string> = {
  low:    "bg-muted-foreground",
  medium: "bg-yellow-400",
  high:   "bg-orange-400",
  urgent: "bg-destructive",
}

// ─── Per-tool output components ───────────────────────────────────────────────

function DashboardSummaryUI({ output }: { output: DashboardSummaryOutput }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <MiniCard label="Companies" value={output.companies} icon={Building2} />
      <MiniCard label="Contacts"  value={output.contacts}  icon={Users} />
      <MiniCard label="Pipeline value" value={formatCurrency(Number(output.dealValue))} icon={DollarSign} />
      <MiniCard label="Open tasks"     value={output.openTasks} icon={CheckSquare} />
    </div>
  )
}

function CompanyListUI({ output }: { output: CompanyListItem[] }) {
  if (!output.length) return <EmptyState message="No companies found." />
  return (
    <div className="space-y-1.5">
      {output.slice(0, 8).map((c) => (
        <Link key={c.id} href={`/companies/${c.id}`}>
          <div className="flex items-center gap-2.5 rounded-md border bg-card px-3 py-2 hover:bg-muted/40 transition-colors">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-semibold">
              {c.name[0].toUpperCase()}
            </div>
            <span className="text-sm font-medium flex-1 truncate">{c.name}</span>
            {c.industry && <span className="text-xs text-muted-foreground hidden sm:block">{c.industry}</span>}
            {c.lifecycleStage && (
              <Badge variant="outline" className="text-[10px] capitalize shrink-0">{c.lifecycleStage}</Badge>
            )}
          </div>
        </Link>
      ))}
      {output.length > 8 && <p className="text-xs text-muted-foreground pt-1">+ {output.length - 8} more</p>}
    </div>
  )
}

function CompanyDetailUI({ output }: { output: CompanyDetailOutput }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted font-semibold">
          {output.name[0].toUpperCase()}
        </div>
        <div>
          <Link href={`/companies/${output.id}`} className="text-sm font-semibold hover:underline">
            {output.name}
          </Link>
          {output.industry && <p className="text-xs text-muted-foreground">{output.industry}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-xs">
        {output.lifecycleStage && (
          <div><span className="text-muted-foreground">Stage: </span><span className="capitalize">{output.lifecycleStage}</span></div>
        )}
        {output.companySize && (
          <div><span className="text-muted-foreground">Size: </span>{output.companySize}</div>
        )}
        {(output.city ?? output.country) && (
          <div><span className="text-muted-foreground">Location: </span>{[output.city, output.country].filter(Boolean).join(", ")}</div>
        )}
        {output.annualRevenue && (
          <div><span className="text-muted-foreground">Revenue: </span>{formatCurrency(Number(output.annualRevenue))}</div>
        )}
      </div>
    </div>
  )
}

function ContactListUI({ output }: { output: ContactListItem[] }) {
  if (!output.length) return <EmptyState message="No contacts found." />
  return (
    <div className="space-y-1.5">
      {output.slice(0, 8).map((c) => (
        <Link key={c.id} href={`/contacts/${c.id}`}>
          <div className="flex items-center gap-2.5 rounded-md border bg-card px-3 py-2 hover:bg-muted/40 transition-colors">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
              {c.firstName[0]}{c.lastName[0]}
            </div>
            <span className="text-sm font-medium flex-1 truncate">{c.firstName} {c.lastName}</span>
            {c.title && <span className="text-xs text-muted-foreground hidden sm:block truncate max-w-[100px]">{c.title}</span>}
            {c.leadScore !== null && (
              <div className="flex items-center gap-1 shrink-0">
                <Star className="h-3 w-3 text-amber-400" />
                <span className="text-xs font-medium">{c.leadScore}</span>
              </div>
            )}
          </div>
        </Link>
      ))}
      {output.length > 8 && <p className="text-xs text-muted-foreground pt-1">+ {output.length - 8} more</p>}
    </div>
  )
}

function ContactDetailUI({ output }: { output: ContactDetailOutput }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
          {output.firstName[0]}{output.lastName[0]}
        </div>
        <div>
          <Link href={`/contacts/${output.id}`} className="text-sm font-semibold hover:underline">
            {output.firstName} {output.lastName}
          </Link>
          {output.title && <p className="text-xs text-muted-foreground">{output.title}</p>}
        </div>
        {output.status && (
          <Badge variant="outline" className="ml-auto capitalize text-xs">{output.status}</Badge>
        )}
      </div>
      {output.leadScore !== null && (
        <div className="flex items-center gap-2">
          <Star className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span className="text-xs text-muted-foreground">Lead score</span>
          <Progress value={output.leadScore} className="flex-1 h-1.5" />
          <span className="text-xs font-medium">{output.leadScore}</span>
        </div>
      )}
    </div>
  )
}

function DealListUI({ output }: { output: DealListItem[] }) {
  if (!output.length) return <EmptyState message="No deals found." />
  return (
    <div className="space-y-1.5">
      {output.slice(0, 8).map((d) => (
        <Link key={d.id} href={`/deals/${d.id}`}>
          <div className="flex items-center gap-2.5 rounded-md border bg-card px-3 py-2 hover:bg-muted/40 transition-colors">
            <TrendingUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="text-sm font-medium flex-1 truncate">{d.title}</span>
            {d.value !== null && (
              <span className="text-xs font-semibold shrink-0">{formatCurrency(Number(d.value))}</span>
            )}
            {d.probability !== null && (
              <span className="text-xs text-muted-foreground shrink-0">{d.probability}%</span>
            )}
          </div>
        </Link>
      ))}
      {output.length > 8 && <p className="text-xs text-muted-foreground pt-1">+ {output.length - 8} more</p>}
    </div>
  )
}

function DealDetailUI({ output }: { output: DealDetailOutput }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
        <Link href={`/deals/${output.id}`} className="text-sm font-semibold hover:underline flex-1 truncate">
          {output.title}
        </Link>
        {output.priority && (
          <Badge variant="outline" className="capitalize text-xs">{output.priority}</Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-xs">
        {output.value !== null && (
          <div><span className="text-muted-foreground">Value: </span><span className="font-medium">{formatCurrency(Number(output.value))}</span></div>
        )}
        {output.probability !== null && (
          <div><span className="text-muted-foreground">Win prob: </span>{output.probability}%</div>
        )}
        {output.expectedCloseDate && (
          <div><span className="text-muted-foreground">Closes: </span>{new Date(output.expectedCloseDate).toLocaleDateString()}</div>
        )}
        {output.riskLevel && (
          <div><span className="text-muted-foreground">Risk: </span><span className="capitalize">{output.riskLevel}</span></div>
        )}
      </div>
      {output.probability !== null && <Progress value={output.probability} className="h-1" />}
    </div>
  )
}

function DealStatsUI({ output }: { output: DealStatsOutput }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <MiniCard label="Total deals"    value={output.totalDeals}                   icon={TrendingUp} />
      <MiniCard label="Pipeline value" value={formatCurrency(output.totalValue)}    icon={DollarSign} />
      <MiniCard label="Avg probability" value={`${Math.round(output.avgProbability)}%`} icon={BarChart3} />
    </div>
  )
}

function TaskListUI({ output }: { output: TaskListItem[] }) {
  if (!output.length) return <EmptyState message="No open tasks." />
  return (
    <div className="space-y-1.5">
      {output.slice(0, 8).map((t) => (
        <div key={t.id} className="flex items-center gap-2.5 rounded-md border bg-card px-3 py-2">
          <div className={`h-2 w-2 rounded-full shrink-0 ${t.priority ? PRIORITY_DOT[t.priority] : "bg-muted-foreground"}`} />
          <span className="text-sm flex-1 truncate">{t.title}</span>
          {t.dueDate && (
            <span className="text-xs text-muted-foreground shrink-0">
              {new Date(t.dueDate.toString()).toLocaleDateString()}
            </span>
          )}
        </div>
      ))}
      {output.length > 8 && <p className="text-xs text-muted-foreground pt-1">+ {output.length - 8} more</p>}
    </div>
  )
}

function RecentActivityUI({ output }: { output: ActivityItem[] }) {
  if (!output.length) return <EmptyState message="No recent activity." />
  return (
    <div className="space-y-1.5">
      {output.slice(0, 6).map((a) => (
        <div key={a.id} className="flex items-start gap-2.5 rounded-md border bg-card px-3 py-2">
          <Activity className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{a.title}</p>
            <p className="text-xs text-muted-foreground">{formatRelativeTime(a.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function SearchDocumentsUI({ output }: { output: DocumentSearchResult[] }) {
  if (!output.length) return <EmptyState message="No relevant notes found." />
  return (
    <div className="space-y-1.5">
      {output.map((r) => (
        <div key={r.documentId} className="flex items-center gap-2.5 rounded-md border bg-card px-3 py-2">
          <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="text-sm flex-1 truncate">{r.title ?? "Untitled note"}</span>
          <div className="flex items-center gap-1 shrink-0">
            <div className="w-12 h-1 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.round(r.relevance * 100)}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground">{Math.round(r.relevance * 100)}%</span>
          </div>
        </div>
      ))}
    </div>
  )
}

//Public API

export function toolLabel(toolName: keyof CrmToolsMap): string {
  return LABELS[toolName]
}

/**
 * Props accept the fully-typed `CrmToolUIPart` from the AI SDK generic.
 * The switch narrows to the correct output type per tool name — no `any`.
 */
interface CrmToolOutputUIProps {
  part: CrmToolUIPart
}

export function CrmToolOutputUI({ part }: CrmToolOutputUIProps) {
  if (part.state !== "output-available") return null

  // TypeScript narrows `part` to the correct union member in each branch
  switch (part.type) {
    case "tool-getDashboardSummary":
      return <DashboardSummaryUI output={part.output} />
    case "tool-listCompanies":
      return <CompanyListUI output={part.output} />
    case "tool-getCompany":
      return part.output ? <CompanyDetailUI output={part.output} /> : <EmptyState message="Company not found." />
    case "tool-listContacts":
      return <ContactListUI output={part.output} />
    case "tool-getContact":
      return part.output ? <ContactDetailUI output={part.output} /> : <EmptyState message="Contact not found." />
    case "tool-listDeals":
      return <DealListUI output={part.output} />
    case "tool-getDeal":
      return part.output ? <DealDetailUI output={part.output} /> : <EmptyState message="Deal not found." />
    case "tool-getDealStats":
      return <DealStatsUI output={part.output} />
    case "tool-listOpenTasks":
      return <TaskListUI output={part.output} />
    case "tool-recentActivity":
      return <RecentActivityUI output={part.output} />
    case "tool-searchDocuments":
      return <SearchDocumentsUI output={part.output} />
    default:
      return null
  }
}
