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

export const documentsRouter = createTRPCRouter({
  list: orgProcedure.query(({ ctx }) => {
    return getDocumentsByOrg(ctx.orgId)
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
