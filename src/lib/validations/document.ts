
import {z} from "zod"

export const createNoteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  companyId: z.string().optional(),
  dealId: z.string().optional(),
})

export const updateDocumentSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required").optional(),
  content: z.string().optional(),
})


export const deleteDocumentSchema = z.object({ id: z.string() })
