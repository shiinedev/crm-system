import { Suspense } from "react"
import { getSessionWithOrg } from "@/utils/get-session"
import { getDashboardSummary } from "@/db/queries/analytics.queries"
import { Building2, Users, TrendingUp, CheckSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/utils/format-currency"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Dashboard" }

const STAT_ICONS = [Building2, Users, TrendingUp, CheckSquare]

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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back, {user.name}</p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats orgId={orgId} />
      </Suspense>
    </div>
  )
}
