"use client"

import { useAction } from "next-safe-action/hooks"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    createTaskAction,
    updateTaskAction,
    deleteTaskAction,
} from "@/server/actions/task.actions"

export function useCreateTask() {
    const router = useRouter()
    return useAction(createTaskAction, {
        onSuccess: () => { toast.success("Task created"); router.refresh() },
        onError: ({ error }) => toast.error(error.serverError ?? "Failed to create task"),
    })
}

export function useUpdateTask() {
    const router = useRouter()
    return useAction(updateTaskAction, {
        onSuccess: () => router.refresh(),
        onError: ({ error }) => toast.error(error.serverError ?? "Failed to update task"),
    })
}

export function useDeleteTask() {
    const router = useRouter()
    return useAction(deleteTaskAction, {
        onSuccess: () => { toast.success("Task deleted"); router.refresh() },
        onError: ({ error }) => toast.error(error.serverError ?? "Failed to delete task"),
    })
}