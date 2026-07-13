import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, orgProcedure } from "../trpc"
import {
  getDocumentsByOrg,
  getDocumentsByCompany,
  getDocumentsByDeal,
  getDocumentById,
  searchDocuments,
} from "@/db/queries/documents.queries"
import { toPage } from "@/db/queries/pagination"
import { listInputSchema, DEFAULT_PAGE_SIZE } from "./list-input"

export const documentsRouter = createTRPCRouter({
  list: orgProcedure
    .input(listInputSchema)
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? DEFAULT_PAGE_SIZE
      const rows = await getDocumentsByOrg(ctx.orgId, {
        limit: limit + 1,
        cursor: input?.cursor ?? undefined,
      })
      return toPage(rows, limit)
    }),

  byCompany: orgProcedure
    .input(z.object({ companyId: z.string() }))
    .query(({ ctx, input }) => {
      return getDocumentsByCompany(input.companyId, ctx.orgId)
    }),

  byDeal: orgProcedure
    .input(z.object({ dealId: z.string() }))
    .query(({ ctx, input }) => {
      return getDocumentsByDeal(input.dealId, ctx.orgId)
    }),

  get: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const doc = await getDocumentById(input.id, ctx.orgId)
      if (!doc) throw new TRPCError({ code: "NOT_FOUND" })
      return doc
    }),

  search: orgProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(({ ctx, input }) => {
      return searchDocuments(ctx.orgId, input.query)
    }),
})
