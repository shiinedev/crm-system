import { TasksBoard } from "@/modules/tasks/components/tasks-board"
import { Metadata } from "next"

export const metadata: Metadata = { title: "Tasks" }

export default function TasksPage() {
    return (
        <div className="flex flex-col h-full">
            <div className="border-b px-6 py-4">
                <h1 className="text-xl font-semibold tracking-tight">Tasks</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Manage your team's work</p>
            </div>
            <div className="flex-1 overflow-hidden">
                <TasksBoard />
            </div>
        </div>
    )
}