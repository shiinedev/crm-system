import z from "zod";

export const createActivitySchema = z.object({
    type: z.enum([
        "call",
        "meeting",
        "email",
        "note",
        "task",
        "status_change",
        "document_upload",
        "comment",
    ]),
    title: z.string().min(1),
    body: z.string().optional(),
    dealId: z.string().optional(),
    companyId: z.string().optional(),
    contactId: z.string().optional(),
})