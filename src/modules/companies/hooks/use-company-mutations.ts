"use client"

import { useAction } from "next-safe-action/hooks"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    createCompanyAction,
    updateCompanyAction,
    deleteCompanyAction,
} from "@/server/actions/companies.actions"

export function useCreateCompany() {
    const router = useRouter()
    return useAction(createCompanyAction, {
        onSuccess: () => {
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
    return useAction(updateCompanyAction, {
        onSuccess: () => {
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
    return useAction(deleteCompanyAction, {
        onSuccess: () => {
            toast.success("Company deleted")
            router.refresh()
        },
        onError: ({ error }) => {
            toast.error(error.serverError ?? "Failed to delete company")
        },
    })
}