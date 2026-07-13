"use client"

import { useState } from "react"
import { useTRPC } from "@/lib/trpc/client"
import { Plus, Search, X, Calendar, AlertCircle, CheckCircle2, Circle, Clock } from "lucide-react"
import { DragDropProvider, useDraggable, useDroppable, type DragEndEvent } from "@dnd-kit/react"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { TaskFormDialog } from "./task-form-dialog"
import { updateTaskAction } from "@/server/actions/task.actions"
import { useFilters } from "@/hooks/use-filters"
import { formatDate } from "@/utils/format-date"
import type { Task } from "@/db/schema"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { cn } from "@/lib/utils"

type TaskStatus = NonNullable<Task["status"]>

const COLUMNS: { id: TaskStatus; label: string; icon: React.ElementType }[] = [
    { id: "todo", label: "To Do", icon: Circle },
    { id: "in_progress", label: "In Progress", icon: Clock },
    { id: "done", label: "Done", icon: CheckCircle2 },
    { id: "cancelled", label: "Cancelled", icon: AlertCircle },
]

const COLUMN_IDS = new Set<string>(COLUMNS.map((c) => c.id))

const PRIORITY_COLORS: Record<string, "outline" | "info" | "warning" | "destructive"> = {
    low: "outline", medium: "info", high: "warning", urgent: "destructive",
}

function TaskCardContent({ task, onToggleComplete }: { task: Task; onToggleComplete?: (task: Task) => void }) {
    return (
        <>
            <div className="flex items-start gap-2">
                <button
                    className="mt-0.5 shrink-0"
                    onClick={(e) => { e.stopPropagation(); onToggleComplete?.(task) }}
                    aria-label={task.status === "done" ? "Mark as to do" : "Mark as done"}
                >
                    {task.status === "done"
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        : <Circle className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    }
                </button>
                <p className={`text-sm leading-snug flex-1 ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                </p>
            </div>
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                {task.priority && (
                    <Badge variant={PRIORITY_COLORS[task.priority] ?? "outline"} className="text-[10px] px-1.5 py-0 capitalize">
                        {task.priority}
                    </Badge>
                )}
                {task.dueDate && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Calendar className="h-2.5 w-2.5" />
                        {formatDate(task.dueDate)}
                    </span>
                )}
            </div>
        </>
    )
}

function DraggableTaskCard({
    task,
    onEdit,
    onToggleComplete,
}: {
    task: Task
    onEdit: (task: Task) => void
    onToggleComplete: (task: Task) => void
}) {
    const { ref, isDragging } = useDraggable({ id: task.id })

    return (
        <div
            ref={ref}
            className={cn(
                "group rounded-lg border bg-card p-3 hover:shadow-sm transition-shadow cursor-grab touch-none",
                isDragging && "shadow-lg cursor-grabbing"
            )}
            onClick={() => onEdit(task)}
        >
            <TaskCardContent task={task} onToggleComplete={onToggleComplete} />
        </div>
    )
}

function DroppableColumn({
    id,
    children,
}: {
    id: TaskStatus
    children: React.ReactNode
}) {
    const { ref, isDropTarget } = useDroppable({ id })
    return (
        <div
            ref={ref}
            className={cn(
                "flex flex-col gap-2 p-2 flex-1 overflow-y-auto rounded-b-xl transition-colors",
                isDropTarget && "bg-primary/5 ring-1 ring-inset ring-primary/20"
            )}
        >
            {children}
        </div>
    )
}

export function TasksBoard() {
    const [formOpen, setFormOpen] = useState(false)
    const [editTask, setEditTask] = useState<Task | undefined>()
    // Optimistic status overrides so a dropped card moves immediately
    const [optimistic, setOptimistic] = useState<Record<string, TaskStatus>>({})

    const trpc = useTRPC()
    const queryClient = useQueryClient()

    const { q, setFilter, taskStatus, taskPriority, hasActiveFilters, resetFilters } = useFilters()

    const { data: tasks = [], isLoading } = useQuery(trpc.tasks.list.queryOptions())

    const { execute: moveTask } = useAction(updateTaskAction, {
        onSuccess: async ({ input }) => {
            await queryClient.invalidateQueries({ queryKey: trpc.tasks.list.queryKey() })
            setOptimistic((prev) => {
                const next = { ...prev }
                if (input.id) delete next[input.id]
                return next
            })
        },
        onError: ({ error, input }) => {
            toast.error(error.serverError ?? "Failed to update task")
            setOptimistic((prev) => {
                const next = { ...prev }
                if (input.id) delete next[input.id]
                return next
            })
        },
    })

    const withOptimistic = tasks.map((t) =>
        optimistic[t.id] ? { ...t, status: optimistic[t.id] } : t
    )

    const filtered = withOptimistic.filter((t) => {
        const matchesQ = !q || t.title.toLowerCase().includes(q.toLowerCase())
        const matchesStatus = !taskStatus || t.status === taskStatus
        const matchesPriority = !taskPriority || t.priority === taskPriority
        return matchesQ && matchesStatus && matchesPriority
    })

    function getByStatus(status: TaskStatus) {
        return filtered.filter((t) => t.status === status)
    }

    function changeStatus(task: Task, status: TaskStatus) {
        if (task.status === status) return
        setOptimistic((prev) => ({ ...prev, [task.id]: status }))
        moveTask({ id: task.id, status })
    }

    function handleComplete(task: Task) {
        changeStatus(task, task.status === "done" ? "todo" : "done")
    }

    function handleDragEnd(event: DragEndEvent) {
        if (event.canceled) return
        const targetId = event.operation.target?.id
        const sourceId = event.operation.source?.id
        if (!targetId || !COLUMN_IDS.has(String(targetId))) return
        const task = tasks.find((t) => t.id === sourceId)
        if (task) changeStatus(task, targetId as TaskStatus)
    }

    function handleEdit(task: Task) {
        setEditTask(task)
        setFormOpen(true)
    }

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 p-4 border-b flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative w-56">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search tasks..."
                            className="pl-8 h-8 text-sm"
                            value={q}
                            onChange={(e) => setFilter("q", e.target.value)}
                        />
                    </div>
                    <Select
                        value={taskStatus || "all"}
                        onValueChange={(v) => setFilter("taskStatus", v === "all" ? null : (v as typeof taskStatus))}
                    >
                        <SelectTrigger className="h-8 w-36 text-sm">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            {COLUMNS.map(({ id, label }) => (
                                <SelectItem key={id} value={id}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={taskPriority || "all"}
                        onValueChange={(v) => setFilter("taskPriority", v === "all" ? null : (v as typeof taskPriority))}
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
                <Button size="sm" onClick={() => { setEditTask(undefined); setFormOpen(true) }}>
                    <Plus className="h-4 w-4" />New task
                </Button>
            </div>

            {/* Board */}
            <div className="flex-1 overflow-x-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">Loading...</div>
                ) : (
                    <DragDropProvider onDragEnd={handleDragEnd}>
                        <div className="flex h-full gap-3 p-4 min-w-max">
                            {COLUMNS.map(({ id, label, icon: Icon }) => {
                                const colTasks = getByStatus(id)
                                return (
                                    <div key={id} className="flex flex-col w-72 shrink-0 rounded-xl bg-muted/40 border">
                                        <div className="flex items-center gap-2 px-3 py-2.5 border-b">
                                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="text-sm font-medium">{label}</span>
                                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full ml-auto">
                                                {colTasks.length}
                                            </span>
                                        </div>
                                        <DroppableColumn id={id}>
                                            {colTasks.map((task) => (
                                                <DraggableTaskCard
                                                    key={task.id}
                                                    task={task}
                                                    onEdit={handleEdit}
                                                    onToggleComplete={handleComplete}
                                                />
                                            ))}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full h-7 text-muted-foreground justify-start gap-1.5 text-xs mt-1"
                                                onClick={() => { setEditTask(undefined); setFormOpen(true) }}
                                            >
                                                <Plus className="h-3.5 w-3.5" />Add task
                                            </Button>
                                        </DroppableColumn>
                                    </div>
                                )
                            })}
                        </div>
                    </DragDropProvider>
                )}
            </div>

            <TaskFormDialog open={formOpen} onOpenChange={setFormOpen} task={editTask} />
        </div>
    )
}
