"use client"

import { Phone, Users, Mail, StickyNote, CheckSquare, ArrowRightLeft, FileText, MessageSquare, Activity as ActivityIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useTRPC } from "@/lib/trpc/client"
import { useQuery } from "@tanstack/react-query"
import { formatRelativeTime } from "@/utils/format-date"

const TYPE_ICON: Record<string, React.ElementType> = {
    call: Phone,
    meeting: Users,
    email: Mail,
    note: StickyNote,
    task: CheckSquare,
    status_change: ArrowRightLeft,
    document_upload: FileText,
    comment: MessageSquare,
}

export function RecentActivityWidget() {
    const trpc = useTRPC()
    const { data = [], isLoading } = useQuery(trpc.activities.recent.queryOptions({ limit: 6 }))

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Recent activity</CardTitle>
                <CardDescription>Latest updates across your organization</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                {isLoading ? (
                    <div className="flex flex-col gap-3 p-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="size-8 rounded-full" />
                                <Skeleton className="h-4 flex-1" />
                            </div>
                        ))}
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                        <ActivityIcon className="size-6 opacity-40" />
                        No activity yet.
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {data.map((activity) => {
                            const Icon = TYPE_ICON[activity.type] ?? ActivityIcon
                            return (
                                <div key={activity.id} className="flex items-center gap-3 px-6 py-3">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                        <Icon className="size-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm">{activity.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatRelativeTime(activity.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
