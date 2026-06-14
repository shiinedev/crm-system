"use client"

import { useAction } from "next-safe-action/hooks"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    createContactAction,
    updateContactAction,
    deleteContactAction,
} from "@/server/actions/contacts.actions"

export function useCreateContact() {
    const router = useRouter()
    return useAction(createContactAction, {
        onSuccess: () => { toast.success("Contact created"); router.refresh() },
        onError: ({ error }) => toast.error(error.serverError ?? "Failed to create contact"),
    })
}

export function useUpdateContact() {
    const router = useRouter()
    return useAction(updateContactAction, {
        onSuccess: () => { toast.success("Contact updated"); router.refresh() },
        onError: ({ error }) => toast.error(error.serverError ?? "Failed to update contact"),
    })
}

export function useDeleteContact() {
    const router = useRouter()
    return useAction(deleteContactAction, {
        onSuccess: () => { toast.success("Contact deleted"); router.refresh() },
        onError: ({ error }) => toast.error(error.serverError ?? "Failed to delete contact"),
    })
}