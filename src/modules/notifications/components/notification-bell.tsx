"use client"

import { useState } from "react"
import { Bell, CheckCheck, Megaphone, UserPlus, TrendingUp, CheckSquare, Sparkles, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
    Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import { useAction } from "next-safe-action/hooks"
import { useRouter } from "next/navigation"
import { formatRelativeTime } from "@/utils/format-date"
import type { Notification } from "@/db/schema"

// Import mark-read actions from notifications
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/server/actions/notifications.actions"
import { useTRPC } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"

const TYPE_ICONS: Record<string, React.ElementType> = {
    mention: Megaphone,
    assignment: UserPlus,
    deal_update: TrendingUp,
    task_due: CheckSquare,
    ai_insight: Sparkles,
    workflow_run: Zap,
    system: Bell,
}

/** Resolve where a notification should navigate to from its metadata */
function getNotificationHref(notification: Notification): string | null {
    if (!notification.metadata) return null
    try {
        const meta = JSON.parse(notification.metadata) as Record<string, string>
        if (meta.dealId) return "/deals"
        if (meta.taskId) return "/tasks"
        if (meta.contactId) return "/contacts"
        if (meta.workflowId) return "/automation"
        return null
    } catch {
        return null
    }
}

function NotificationItem({
    notification,
    onRead,
    onNavigate,
}: {
    notification: Notification
    onRead: (id: string) => void
    onNavigate: (href: string) => void
}) {
    const Icon = TYPE_ICONS[notification.type] ?? Bell
    const isUnread = !notification.readAt
    const href = getNotificationHref(notification)

    return (
        <div
            className={cn(
                "flex gap-3 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer group",
                isUnread && "bg-primary/5"
            )}
            onClick={() => {
                if (isUnread) onRead(notification.id)
                if (href) onNavigate(href)
            }}
        >
            <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                isUnread ? "bg-primary/10" : "bg-muted"
            )}>
                <Icon className={cn("h-3.5 w-3.5", isUnread ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div className="flex-1 min-w-0">
                <p className={cn("text-sm leading-snug", isUnread ? "font-medium" : "text-muted-foreground")}>
                    {notification.title}
                </p>
                {notification.body && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.body}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(notification.createdAt)}</p>
            </div>
            {isUnread && (
                <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
            )}
        </div>
    )
}

export function NotificationsBell() {
    const [open, setOpen] = useState(false)
    const router = useRouter()
    const trpc = useTRPC()
    const { data: notifications = [], refetch, isLoading } = useQuery(trpc.notifications.list.queryOptions(
        { limit: 30 },
        { enabled: open }
    ))

    // Badge count is fetched independently so it shows without opening the popover
    const { data: unreadCount = 0, refetch: refetchCount } = useQuery(
        trpc.notifications.unreadCount.queryOptions(undefined, {
            refetchInterval: 60_000,
            refetchOnWindowFocus: true,
        })
    )

    const { execute: markRead } = useAction(markNotificationReadAction, {
        onSuccess: () => { refetch(); refetchCount() },
    })

    const { execute: markAllRead } = useAction(markAllNotificationsReadAction, {
        onSuccess: () => { refetch(); refetchCount(); router.refresh() },
    })

    function handleNavigate(href: string) {
        setOpen(false)
        router.push(href)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="text-sm font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1.5 text-xs text-muted-foreground"
                            onClick={() => markAllRead({})}
                        >
                            <CheckCheck className="h-3.5 w-3.5" />
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-80">
                    {isLoading ? (
                        <div className="space-y-1 p-1">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex gap-3 px-4 py-3">
                                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                                    <div className="flex-1 space-y-1.5">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 gap-1.5 text-muted-foreground">
                            <Bell className="h-5 w-5 opacity-30" />
                            <p className="text-sm">All caught up</p>
                        </div>
                    ) : (
                        <div>
                            {notifications.map((n, idx) => (
                                <div key={n.id}>
                                    <NotificationItem
                                        notification={n}
                                        onRead={(id) => markRead({ id })}
                                        onNavigate={handleNavigate}
                                    />
                                    {idx < notifications.length - 1 && <Separator />}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}