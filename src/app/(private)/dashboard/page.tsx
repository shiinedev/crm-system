import { Suspense } from "react"
import { and, eq } from "drizzle-orm"
import { getSessionWithOrg } from "@/utils/get-session"
import { db } from "@/db"
import { members } from "@/db/schema"
import { getDashboardSummary } from "@/db/queries/analytics.queries"
import { Building2, Users, TrendingUp, CheckSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/utils/format-currency"
import { formatDate } from "@/utils/format-date"
import { canViewAnalytics } from "@/lib/roles"
import type { OrgRole } from "@/lib/permissions"
import { MyTasksWidget } from "@/modules/dashboard/components/my-tasks-widget"
import { RecentActivityWidget } from "@/modules/dashboard/components/recent-activity-widget"
import { RevenueChart } from "@/modules/analytics/components/revenue-chart"
import { PipelineHealthChart } from "@/modules/analytics/components/pipeline-health"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Dashboard" }

const STAT_ICONS = [Building2, Users, TrendingUp, CheckSquare]

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STAT_ICONS.map((Icon, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-24" />
            <Icon className="h-4 w-4 text-muted-foreground/40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

async function DashboardStats({ orgId }: { orgId: string }) {
  const summary = await getDashboardSummary(orgId)

  const stats = [
    { label: "Companies", value: String(summary.companies), icon: Building2 },
    { label: "Contacts", value: String(summary.contacts), icon: Users },
    {
      label: "Open Deals",
      value: `${summary.deals} · ${formatCurrency(summary.dealValue, "USD", true)}`,
      icon: TrendingUp,
    },
    { label: "Open Tasks", value: String(summary.openTasks), icon: CheckSquare },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon }) => (
        <Card key={label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default async function DashboardPage() {
  const { user, orgId } = await getSessionWithOrg()

  // Role determines whether the analytics widgets are shown (manager+).
  const [member] = await db
    .select({ role: members.role })
    .from(members)
    .where(and(eq(members.userId, user.id), eq(members.organizationId, orgId)))
    .limit(1)
  const role = member?.role as OrgRole | undefined
  const showAnalytics = role ? canViewAnalytics(role) : false

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {greeting()}, {user.name} · {formatDate(new Date(), { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats orgId={orgId} />
      </Suspense>

      {showAnalytics && (
        <div className="grid gap-4 lg:grid-cols-2">
          <RevenueChart />
          <PipelineHealthChart />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <MyTasksWidget />
        <RecentActivityWidget />
      </div>
    </div>
  )
}
