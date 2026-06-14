"use client"

import { useAction } from "next-safe-action/hooks"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    createCompanyAction,
    updateCompanyAction,
    deleteCompanyAction,
} from "@/server/actions/companies.actions"

import { useTRPC } from "@/lib/trpc/client"
import { queryClient } from "@/lib/trpc/query-client"

export function useCreateCompany() {
    const router = useRouter()
    const trpc = useTRPC()

    return useAction(createCompanyAction, {
        onSuccess: () => {
            queryClient.invalidateQueries(trpc.companies.list.queryOptions())
            toast.success("Company created")
            router.refresh()

        },
        onError: ({ error }) => {
            toast.error(error.serverError ?? "Failed to create company")
        },
    })
}

export function useUpdateCompany() {
    const router = useRouter()
    const trpc = useTRPC()
    return useAction(updateCompanyAction, {
        onSuccess: () => {
            queryClient.invalidateQueries(trpc.companies.list.queryOptions())
            toast.success("Company updated")
            router.refresh()
        },
        onError: ({ error }) => {
            toast.error(error.serverError ?? "Failed to update company")
        },
    })
}

export function useDeleteCompany() {
    const router = useRouter()
    const trpc = useTRPC()

    return useAction(deleteCompanyAction, {
        onSuccess: () => {
            queryClient.invalidateQueries(trpc.companies.list.queryOptions())
            toast.success("Company deleted")
            router.refresh()
        },
        onError: ({ error }) => {
            toast.error(error.serverError ?? "Failed to delete company")
        },
    })
}