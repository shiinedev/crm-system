"use client"

import Link from "next/link"
import { CheckSquare } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { useTRPC } from "@/lib/trpc/client"
import { useQuery } from "@tanstack/react-query"
import { formatDate } from "@/utils/format-date"

const OPEN_STATUSES = new Set(["todo", "in_progress"])

const PRIORITY_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    urgent: "destructive",
    high: "destructive",
    medium: "secondary",
    low: "outline",
}

export function MyTasksWidget() {
    const trpc = useTRPC()
    const { data = [], isLoading } = useQuery(trpc.tasks.mine.queryOptions())
    const open = data.filter((t) => OPEN_STATUSES.has(t.status ?? "todo")).slice(0, 5)

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-sm font-medium">My open tasks</CardTitle>
                    <CardDescription>Tasks assigned to you</CardDescription>
                </div>
                <Link href="/tasks" className="text-xs text-muted-foreground hover:text-foreground">
                    View all
                </Link>
            </CardHeader>
            <CardContent className="p-0">
                {isLoading ? (
                    <div className="flex flex-col gap-3 p-6">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-5 w-full" />
                        ))}
                    </div>
                ) : open.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                        <CheckSquare className="size-6 opacity-40" />
                        You&apos;re all caught up.
                    </div>
                ) : (
                    <div>
                        {open.map((task, idx) => (
                            <div key={task.id}>
                                <Link
                                    href="/tasks"
                                    className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{task.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {task.dueDate ? `Due ${formatDate(task.dueDate)}` : "No due date"}
                                        </p>
                                    </div>
                                    {task.priority && (
                                        <Badge variant={PRIORITY_VARIANT[task.priority] ?? "outline"} className="shrink-0 capitalize">
                                            {task.priority}
                                        </Badge>
                                    )}
                                </Link>
                                {idx < open.length - 1 && <Separator />}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
