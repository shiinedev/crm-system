"use client"

import { Phone, Mail, Calendar, FileText, CheckSquare, ArrowRight, Upload, MessageSquare, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDeleteActivity } from "../hooks/use-activity-mutations"
import { formatRelativeTime } from "@/utils/format-date"
import type { Activity } from "@/db/schema"

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    call: { icon: Phone, color: "text-blue-500", label: "Call" },
    email: { icon: Mail, color: "text-purple-500", label: "Email" },
    meeting: { icon: Calendar, color: "text-green-500", label: "Meeting" },
    note: { icon: FileText, color: "text-yellow-500", label: "Note" },
    task: { icon: CheckSquare, color: "text-orange-500", label: "Task" },
    status_change: { icon: ArrowRight, color: "text-gray-500", label: "Status change" },
    document_upload: { icon: Upload, color: "text-teal-500", label: "Document" },
    comment: { icon: MessageSquare, color: "text-pink-500", label: "Comment" },
}

interface ActivityTimelineProps {
    activities: Activity[]
    isLoading?: boolean
}

export function ActivityTimeline({ activities, isLoading }: ActivityTimelineProps) {
    const { execute: deleteActivity } = useDeleteActivity()

    if (isLoading) {
        return (
            <div className="space-y-3 p-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                        <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
                        <div className="flex-1 space-y-1.5">
                            <div className="h-3.5 w-1/3 rounded bg-muted" />
                            <div className="h-3 w-2/3 rounded bg-muted" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-sm text-muted-foreground gap-1">
                <FileText className="h-6 w-6 opacity-30" />
                <p>No activity yet</p>
            </div>
        )
    }

    return (
        <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-7 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-0">
                {activities.map((activity, idx) => {
                    const config = TYPE_CONFIG[activity.type] ?? TYPE_CONFIG.note
                    const Icon = config.icon

                    return (
                        <div key={activity.id} className="relative flex gap-3 p-4 group hover:bg-muted/30 transition-colors">
                            {/* Icon */}
                            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background border">
                                <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 pt-0.5">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <span className="text-sm font-medium">{activity.title}</span>
                                        <span className="text-xs text-muted-foreground ml-2">{config.label}</span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <span className="text-xs text-muted-foreground">
                                            {formatRelativeTime(activity.createdAt)}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                                            onClick={() => deleteActivity({ id: activity.id })}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                                {activity.body && (
                                    <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">{activity.body}</p>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}