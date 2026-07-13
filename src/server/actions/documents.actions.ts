"use server"

import { orgActionClient, ActionError } from "./safe-action"
import {
  createDocument,
  updateDocument,
  softDeleteDocument,
} from "@/db/queries/documents.queries"
import { createActivity } from "@/db/queries/activities.queries"
import { createNoteSchema, deleteDocumentSchema, updateDocumentSchema } from "@/lib/validations/document"
import { logAudit } from "@/server/audit"


export const createNoteAction = orgActionClient
  .inputSchema(createNoteSchema)
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

    await logAudit({
      orgId: ctx.orgId,
      userId: ctx.user.id,
      action: "document.created",
      resourceType: "document",
      resourceId: doc.id,
      after: doc,
    })

    return { doc }
  })

export const updateDocumentAction = orgActionClient
  .inputSchema(updateDocumentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { id, ...data } = parsedInput
    const doc = await updateDocument(id, ctx.orgId, data)
    if (!doc) throw new ActionError("Document not found.")
    await logAudit({
      orgId: ctx.orgId,
      userId: ctx.user.id,
      action: "document.updated",
      resourceType: "document",
      resourceId: doc.id,
      after: data,
    })
    return { doc }
  })

export const deleteDocumentAction = orgActionClient
  .inputSchema(deleteDocumentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const doc = await softDeleteDocument(parsedInput.id, ctx.orgId)
    if (!doc) throw new ActionError("Document not found.")
    await logAudit({
      orgId: ctx.orgId,
      userId: ctx.user.id,
      action: "document.deleted",
      resourceType: "document",
      resourceId: doc.id,
      before: doc,
    })
    return { doc }
  })
