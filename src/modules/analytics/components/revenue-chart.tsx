"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/utils/format-currency"
import { useTRPC } from "@/lib/trpc/client"
import { useQuery } from "@tanstack/react-query"

export function RevenueChart() {

  const trpc = useTRPC();
  const { data = [], isLoading } = useQuery(trpc.analytics.revenueByMonth.queryOptions({ months: 12 }))

  const formatted = data.map((d) => ({
    month: d.month,
    value: Number(d.totalValue),
    deals: d.dealCount,
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Pipeline value by month</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : formatted.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={formatted} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <YAxis
                tickFormatter={(v: number) => formatCurrency(v, "USD", true)}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false} axisLine={false} width={60}
              />
              <Tooltip
                formatter={(value: any, _name: any) => [
                  formatCurrency(Number(value ?? 0), "USD"), "Value",
                ]}
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
              />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
