import { z } from "zod"

export const DEFAULT_PAGE_SIZE = 50

/** Shared input for cursor-paginated list procedures */
export const listInputSchema = z
    .object({
        limit: z.number().min(1).max(100).default(DEFAULT_PAGE_SIZE),
        cursor: z.object({ createdAt: z.date(), id: z.string() }).nullish(),
    })
    .optional()
