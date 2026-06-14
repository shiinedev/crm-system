"use client"

import { useAction } from "next-safe-action/hooks"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createActivityAction, deleteActivityAction } from "@/server/actions/activity.actions"

export function useCreateActivity() {
    const router = useRouter()
    return useAction(createActivityAction, {
        onSuccess: () => { toast.success("Activity logged"); router.refresh() },
        onError: ({ error }) => toast.error(error.serverError ?? "Failed to log activity"),
    })
}

export function useDeleteActivity() {
    const router = useRouter()
    return useAction(deleteActivityAction, {
        onSuccess: () => { toast.success("Activity deleted"); router.refresh() },
        onError: ({ error }) => toast.error(error.serverError ?? "Failed to delete activity"),
    })
}