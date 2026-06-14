import { DealsKanban } from "@/modules/deals/components/deals-kanban"
import { Metadata } from "next"

export const metadata: Metadata = { title: "Deals" }

export default function DealsPage() {
    return (
        <div className="flex flex-col h-full">
            <div className="border-b px-6 py-4">
                <h1 className="text-xl font-semibold tracking-tight">Deals</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Track your pipeline and opportunities</p>
            </div>
            <div className="flex-1 overflow-hidden">
                <DealsKanban />
            </div>
        </div>
    )
}