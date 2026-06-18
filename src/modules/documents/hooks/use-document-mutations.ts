"use client"

import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
import { trpc } from "@/lib/trpc/client"
import {
  createNoteAction,
  updateDocumentAction,
  deleteDocumentAction,
} from "@/server/actions/documents.actions"

export function useCreateNote() {
  // const utils = trpc.useUtils()
  return useAction(createNoteAction, {
    onSuccess: () => {
      toast.success("Note created")
      // void utils.documents.list.invalidate()
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to create note"),
  })
}

export function useUpdateDocument() {
  // const utils = trpc.useUtils()
  return useAction(updateDocumentAction, {
    onSuccess: () => {
      toast.success("Document saved")
      // void utils.documents.list.invalidate()
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to save document"),
  })
}

export function useDeleteDocument() {
  // const utils = trpc.useUtils()
  return useAction(deleteDocumentAction, {
    onSuccess: () => {
      toast.success("Document deleted")
      // void utils.documents.list.invalidate()
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to delete document"),
  })
}
