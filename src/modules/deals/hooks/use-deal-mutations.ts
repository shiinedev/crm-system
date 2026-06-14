"use client"

import { useAction } from "next-safe-action/hooks"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    createDealAction,
    updateDealAction,
    deleteDealAction,
    changeDealStageAction,
} from "@/server/actions/deals.actions"

export function useCreateDeal() {
    const router = useRouter()
    return useAction(createDealAction, {
        onSuccess: () => { toast.success("Deal created"); router.refresh() },
        onError: ({ error }) => toast.error(error.serverError ?? "Failed to create deal"),
    })
}

export function useUpdateDeal() {
    const router = useRouter()
    return useAction(updateDealAction, {
        onSuccess: () => { toast.success("Deal updated"); router.refresh() },
        onError: ({ error }) => toast.error(error.serverError ?? "Failed to update deal"),
    })
}

export function useDeleteDeal() {
    const router = useRouter()
    return useAction(deleteDealAction, {
        onSuccess: () => { toast.success("Deal deleted"); router.refresh() },
        onError: ({ error }) => toast.error(error.serverError ?? "Failed to delete deal"),
    })
}

export function useChangeDealStage() {
    const router = useRouter()
    return useAction(changeDealStageAction, {
        onSuccess: () => router.refresh(),
        onError: ({ error }) => toast.error(error.serverError ?? "Failed to move deal"),
    })
}