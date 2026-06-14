"use client"

import { useState } from "react"
import { Plus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { DealCard } from "./deal-card"
import { DealFormDialog } from "./deal-form-dialog"
import { useDeleteDeal, useChangeDealStage } from "../hooks/use-deal-mutations"
import { useFilters } from "@/hooks/use-filters"
import { formatCurrency } from "@/utils/format-currency"
import type { Deal } from "@/db/schema"
import { useTRPC } from "@/lib/trpc/client"
import { useQuery } from "@tanstack/react-query"

export function DealsKanban() {
    const [formOpen, setFormOpen] = useState(false)
    const [editDeal, setEditDeal] = useState<Deal | undefined>()
    const [addingToStageId, setAddingToStageId] = useState<string | undefined>()

    const trpc = useTRPC()

    const { q, setFilter, dealPipelineId, dealPriority, hasActiveFilters, resetFilters } = useFilters()

    const { data: pipelines = [] } = useQuery(trpc.pipelines.list.queryOptions())
    const activePipelineId = dealPipelineId || pipelines[0]?.id

    const { data: pipelineData } = useQuery(trpc.pipelines.getWithStages.queryOptions(
        { id: activePipelineId },
        { enabled: !!activePipelineId }
    ))
    const { data: deals = [] } = useQuery(trpc.deals.byPipeline.queryOptions(
        { pipelineId: activePipelineId },
        { enabled: !!activePipelineId }
    ))

    const { execute: deleteDeal } = useDeleteDeal()
    const { execute: changeStage } = useChangeDealStage()

    const stages = pipelineData?.stages ?? []

    const filteredDeals = deals.filter((d) => {
        const matchesQ = !q || d.title.toLowerCase().includes(q.toLowerCase())
        const matchesPriority = !dealPriority || d.priority === dealPriority
        return matchesQ && matchesPriority
    })

    function getDealsByStage(stageId: string) {
        return filteredDeals.filter((d) => d.stageId === stageId)
    }

    function getStageTotal(stageId: string) {
        return getDealsByStage(stageId)
            .reduce((sum, d) => sum + Number(d.value ?? 0), 0)
    }

    function handleDragStart(e: React.DragEvent, dealId: string) {
        e.dataTransfer.setData("dealId", dealId)
    }

    function handleDrop(e: React.DragEvent, stageId: string) {
        e.preventDefault()
        const dealId = e.dataTransfer.getData("dealId")
        const deal = deals.find((d) => d.id === dealId)
        if (deal && deal.stageId !== stageId) {
            changeStage({ id: dealId, stageId })
        }
    }

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault()
    }

    function handleEdit(deal: Deal) {
        setEditDeal(deal)
        setAddingToStageId(undefined)
        setFormOpen(true)
    }

    function handleAddToStage(stageId: string) {
        setEditDeal(undefined)
        setAddingToStageId(stageId)
        setFormOpen(true)
    }

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 p-4 border-b flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Pipeline selector */}
                    <Select
                        value={activePipelineId ?? ""}
                        onValueChange={(v) => setFilter("dealPipelineId", v)}
                    >
                        <SelectTrigger className="h-8 w-40 text-sm">
                            <SelectValue placeholder="Pipeline" />
                        </SelectTrigger>
                        <SelectContent>
                            {pipelines.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="relative w-56">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search deals..."
                            className="pl-8 h-8 text-sm"
                            value={q}
                            onChange={(e) => setFilter("q", e.target.value)}
                        />
                    </div>

                    <Select
                        value={dealPriority || "all"}
                        onValueChange={(v) => setFilter("dealPriority", v === "all" ? null : v as any)}
                    >
                        <SelectTrigger className="h-8 w-32 text-sm">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All priorities</SelectItem>
                            {["low", "medium", "high", "urgent"].map((p) => (
                                <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground" onClick={resetFilters}>
                            <X className="h-3.5 w-3.5" />Clear
                        </Button>
                    )}
                </div>

                <Button size="sm" onClick={() => { setEditDeal(undefined); setAddingToStageId(undefined); setFormOpen(true) }}>
                    <Plus className="h-4 w-4" />New deal
                </Button>
            </div>

            {/* Kanban board */}
            <div className="flex-1 overflow-x-auto">
                <div className="flex h-full gap-3 p-4 min-w-max">
                    {stages.map((stage) => {
                        const stageDeals = getDealsByStage(stage.id)
                        const total = getStageTotal(stage.id)

                        return (
                            <div
                                key={stage.id}
                                className="flex flex-col w-72 shrink-0 rounded-xl bg-muted/40 border"
                                onDrop={(e) => handleDrop(e, stage.id)}
                                onDragOver={handleDragOver}
                            >
                                {/* Stage header */}
                                <div className="flex items-center justify-between px-3 py-2.5 border-b">
                                    <div className="flex items-center gap-2">
                                        {stage.color && (
                                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color }} />
                                        )}
                                        <span className="text-sm font-medium">{stage.name}</span>
                                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                                            {stageDeals.length}
                                        </span>
                                    </div>
                                    {total > 0 && (
                                        <span className="text-xs font-medium text-muted-foreground">
                                            {formatCurrency(total, "USD", true)}
                                        </span>
                                    )}
                                </div>

                                {/* Deal cards */}
                                <div className="flex flex-col gap-2 p-2 flex-1 overflow-y-auto min-h-[120px]">
                                    {stageDeals.map((deal) => (
                                        <div
                                            key={deal.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, deal.id)}
                                        >
                                            <DealCard
                                                deal={deal}
                                                onEdit={handleEdit}
                                                onDelete={(id) => deleteDeal({ id })}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Add deal to stage */}
                                <div className="p-2 border-t">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full h-7 text-muted-foreground justify-start gap-1.5 text-xs"
                                        onClick={() => handleAddToStage(stage.id)}
                                    >
                                        <Plus className="h-3.5 w-3.5" />Add deal
                                    </Button>
                                </div>
                            </div>
                        )
                    })}

                    {stages.length === 0 && (
                        <div className="flex items-center justify-center w-full text-sm text-muted-foreground">
                            {pipelines.length === 0
                                ? "Create a pipeline in Settings to get started"
                                : "No stages found for this pipeline"}
                        </div>
                    )}
                </div>
            </div>

            <DealFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                deal={editDeal}
                defaultPipelineId={activePipelineId}
                defaultStageId={addingToStageId}
            />
        </div>
    )
}