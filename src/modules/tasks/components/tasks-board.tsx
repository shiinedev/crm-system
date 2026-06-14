"use client"

import { useState } from "react"
import { useTRPC } from "@/lib/trpc/client"
import { Plus, Search, X, Calendar, AlertCircle, CheckCircle2, Circle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { TaskFormDialog } from "./task-form-dialog"
import { useDeleteTask, useUpdateTask } from "../hooks/use-task-mutations"
import { useFilters } from "@/hooks/use-filters"
import { formatDate } from "@/utils/format-date"
import type { Task } from "@/db/schema"
import { useQuery } from "@tanstack/react-query"

const COLUMNS: { id: string; label: string; icon: React.ElementType }[] = [
    { id: "todo", label: "To Do", icon: Circle },
    { id: "in_progress", label: "In Progress", icon: Clock },
    { id: "done", label: "Done", icon: CheckCircle2 },
    { id: "cancelled", label: "Cancelled", icon: AlertCircle },
]

const PRIORITY_COLORS: Record<string, "outline" | "info" | "warning" | "destructive"> = {
    low: "outline", medium: "info", high: "warning", urgent: "destructive",
}

export function TasksBoard() {
    const [formOpen, setFormOpen] = useState(false)
    const [editTask, setEditTask] = useState<Task | undefined>()

    const trpc = useTRPC()

    const { q, setFilter, taskStatus, taskPriority, hasActiveFilters, resetFilters } = useFilters()

    const { data: tasks = [], isLoading } = useQuery(trpc.tasks.list.queryOptions())
    const { execute: deleteTask } = useDeleteTask()
    const { execute: updateTask } = useUpdateTask()

    const filtered = tasks.filter((t) => {
        const matchesQ = !q || t.title.toLowerCase().includes(q.toLowerCase())
        const matchesStatus = !taskStatus || t.status === taskStatus
        const matchesPriority = !taskPriority || t.priority === taskPriority
        return matchesQ && matchesStatus && matchesPriority
    })

    function getByStatus(status: string | null) {
        return filtered.filter((t) => t.status === status)
    }

    function handleComplete(task: Task) {
        updateTask({ id: task.id, status: (task.status === "done" ? "todo" : "done") as "todo" | "done" })
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
                        onValueChange={(v) => setFilter("taskStatus", v === "all" ? null : v as any)}
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
                        onValueChange={(v) => setFilter("taskPriority", v === "all" ? null : v as any)}
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
                                    <div className="flex flex-col gap-2 p-2 flex-1 overflow-y-auto">
                                        {colTasks.map((task) => (
                                            <div
                                                key={task.id}
                                                className="group rounded-lg border bg-card p-3 hover:shadow-sm transition-shadow cursor-pointer"
                                                onClick={() => { setEditTask(task); setFormOpen(true) }}
                                            >
                                                <div className="flex items-start gap-2">
                                                    <button
                                                        className="mt-0.5 shrink-0"
                                                        onClick={(e) => { e.stopPropagation(); handleComplete(task) }}
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
                                            </div>
                                        ))}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full h-7 text-muted-foreground justify-start gap-1.5 text-xs mt-1"
                                            onClick={() => { setEditTask(undefined); setFormOpen(true) }}
                                        >
                                            <Plus className="h-3.5 w-3.5" />Add task
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <TaskFormDialog open={formOpen} onOpenChange={setFormOpen} task={editTask} />
        </div>
    )
}