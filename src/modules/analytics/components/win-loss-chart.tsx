"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/utils/format-currency"
import { useTRPC } from "@/lib/trpc/client"
import { useQuery } from "@tanstack/react-query"


const COLORS: Record<string, string> = {
  closed_won:  "hsl(142 76% 36%)",
  commit:      "hsl(217 91% 60%)",
  best_case:   "hsl(38 92% 50%)",
  pipeline:    "hsl(var(--muted-foreground))",
  closed_lost: "hsl(0 84% 60%)",
  omitted:     "hsl(var(--border))",
}

const LABELS: Record<string, string> = {
  closed_won: "Won", commit: "Commit", best_case: "Best case",
  pipeline: "Pipeline", closed_lost: "Lost", omitted: "Omitted",
}

export function WinLossChart() {

  const trpc = useTRPC()
  const { data = [], isLoading } = useQuery(trpc.analytics.winLoss.queryOptions())

  const formatted = data
    .filter((d) => d.forecastCategory && d.count > 0)
    .map((d) => ({
      name: LABELS[d.forecastCategory!] ?? d.forecastCategory,
      key: d.forecastCategory!,
      count: d.count,
      value: Number(d.totalValue),
    }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Forecast breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : formatted.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            No forecast data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={formatted}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="count"
              >
                {formatted.map((entry) => (
                  <Cell key={entry.key} fill={COLORS[entry.key] ?? "hsl(var(--primary))"} />
                ))}
              </Pie>
                  <Tooltip
                    formatter={(value:any, name:any, props:any) => [
                  `${value} deals · ${formatCurrency(props.payload?.value ?? 0, "USD", true)}`,
                  name,
                ]}
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
              />
              <Legend
                formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
