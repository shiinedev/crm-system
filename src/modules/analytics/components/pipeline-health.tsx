"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/utils/format-currency"
import { useState } from "react"
import { useTRPC } from "@/lib/trpc/client"
import { useQuery } from "@tanstack/react-query"

export function PipelineHealthChart() {

  const trpc = useTRPC();
  const { data: pipelines = [] } = useQuery(trpc.pipelines.list.queryOptions())
  const [pipelineId, setPipelineId] = useState<string>("")
  const activePipelineId = pipelineId || pipelines[0]?.id

  const { data: stagesData, isLoading } = useQuery(trpc.analytics.pipelineHealth.queryOptions(
    { pipelineId: activePipelineId },
    { enabled: !!activePipelineId }
  ));
  const { data: pipelineWithStages } = useQuery(trpc.pipelines.getWithStages.queryOptions(
    { id: activePipelineId },
    { enabled: !!activePipelineId }
  ))

  const formatted = (stagesData ?? []).map((d) => {
    const stage = pipelineWithStages?.stages.find((s) => s.id === d.stageId)
    return {
      stage: stage?.name ?? d.stageId.slice(0, 8),
      deals: d.dealCount,
      value: Number(d.totalValue),
    }
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Pipeline health</CardTitle>
        {pipelines.length > 1 && (
          <Select value={activePipelineId} onValueChange={setPipelineId}>
            <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {pipelines.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : formatted.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No pipeline data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={formatted} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="stage" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="deals" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={30} />
              <Tooltip
                formatter={(value: any, name: any) =>
                  name === "value"
                    ? [formatCurrency(Number(value ?? 0), "USD", true), "Value"]
                    : [String(value ?? 0), "Deals"]
                }
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
              />
              <Bar yAxisId="deals" dataKey="deals" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
