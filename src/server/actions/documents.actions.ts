"use server"

import { z } from "zod"
import { orgActionClient, ActionError } from "./safe-action"
import {
  createDocument,
  updateDocument,
  softDeleteDocument,
} from "@/src/db/queries/documents.queries"
import { createActivity } from "@/src/db/queries/activities.queries"
import { createNoteSchema, updateDocumentSchema } from "@/lib/validations/document"


export const createNoteAction = orgActionClient
  .schema(createNoteSchema)
  .action(async ({ parsedInput, ctx }) => {
    const doc = await createDocument({
      ...parsedInput,
      organizationId: ctx.orgId,
      uploadedById: ctx.user.id,
    })

    if (parsedInput.dealId) {
      await createActivity({
        organizationId: ctx.orgId,
        type: "document_upload",
        title: `Note created: ${doc.title}`,
        dealId: parsedInput.dealId,
        companyId: parsedInput.companyId ?? undefined,
        userId: ctx.user.id,
      })
    }

    return { doc }
  })

export const updateDocumentAction = orgActionClient
  .schema(updateDocumentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { id, ...data } = parsedInput
    const doc = await updateDocument(id, ctx.orgId, data)
    if (!doc) throw new ActionError("Document not found.")
    return { doc }
  })

export const deleteDocumentAction = orgActionClient
  .schema(deleteDocumentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const doc = await softDeleteDocument(parsedInput.id, ctx.orgId)
    if (!doc) throw new ActionError("Document not found.")
    return { doc }
  })
