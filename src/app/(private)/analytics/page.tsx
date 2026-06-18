import { getSessionWithOrg } from "@/utils/get-session"
import { KpiCards } from "@/modules/analytics/components/kpi-cards"
import { RevenueChart } from "@/modules/analytics/components/revenue-chart"
import { PipelineHealthChart } from "@/modules/analytics/components/pipeline-health"
import { WinLossChart } from "@/modules/analytics/components/win-loss-chart"
import { Metadata } from "next"

export const metadata:Metadata = { title: "Analytics" }

export default async function AnalyticsPage() {
  await getSessionWithOrg()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Pipeline performance and team insights</p>
      </div>

      <KpiCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <PipelineHealthChart />
        <WinLossChart />
      </div>
    </div>
  )
}
