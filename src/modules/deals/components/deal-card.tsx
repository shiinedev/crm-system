"use client"

import { MoreHorizontal, Pencil, Trash2, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency } from "@/utils/format-currency"
import { formatDate } from "@/utils/format-date"
import type { Deal } from "@/db/schema"

const PRIORITY_COLORS: Record<string, "outline" | "info" | "warning" | "destructive"> = {
    low: "outline",
    medium: "info",
    high: "warning",
    urgent: "destructive",
}

interface DealCardProps {
    deal: Deal
    onEdit: (deal: Deal) => void
    onDelete: (id: string) => void
}

export function DealCard({ deal, onEdit, onDelete }: DealCardProps) {
    return (
        <div className="group rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug line-clamp-2 flex-1">{deal.title}</p>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 -mt-0.5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(deal)}>
                            <Pencil className="h-4 w-4" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => onDelete(deal.id)}
                        >
                            <Trash2 className="h-4 w-4" />Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="mt-2.5 flex flex-col gap-1.5">
                {deal.value && (
                    <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(deal.value, deal.currency ?? "USD")}
                    </span>
                )}

                <div className="flex items-center gap-1.5 flex-wrap">
                    {deal.priority && (
                        <Badge variant={PRIORITY_COLORS[deal.priority] ?? "outline"} className="capitalize text-[10px] px-1.5 py-0">
                            {deal.priority}
                        </Badge>
                    )}
                    {deal.probability != null && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {deal.probability}%
                        </Badge>
                    )}
                </div>

                {deal.expectedCloseDate && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(deal.expectedCloseDate)}
                    </div>
                )}
            </div>
        </div>
    )
}