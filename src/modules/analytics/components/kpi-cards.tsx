"use client"

import { TrendingUp, Users, Building2, CheckSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/utils/format-currency"
import { formatCompactNumber } from "@/utils/format-compact-number"
import { useTRPC } from "@/lib/trpc/client"
import { useQuery } from "@tanstack/react-query"

export function KpiCards() {

  const trpc = useTRPC()
  const { data: summary, isLoading } = useQuery(trpc.analytics.dashboardSummary.queryOptions())

  const cards = [
    {
      label: "Total companies",
      value: summary ? formatCompactNumber(summary.companies) : null,
      icon: Building2,
    },
    {
      label: "Total contacts",
      value: summary ? formatCompactNumber(summary.contacts) : null,
      icon: Users,
    },
    {
      label: "Pipeline value",
      value: summary ? formatCurrency(summary.dealValue, "USD", true) : null,
      icon: TrendingUp,
    },
    {
      label: "Open tasks",
      value: summary ? formatCompactNumber(summary.openTasks) : null,
      icon: CheckSquare,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon }) => (
        <Card key={label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading || !value
              ? <Skeleton className="h-8 w-24" />
              : <p className="text-2xl font-bold">{value}</p>
            }
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
