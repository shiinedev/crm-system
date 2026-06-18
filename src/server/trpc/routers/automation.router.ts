import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, orgProcedure, managerProcedure } from "../trpc"
import {
  getWorkflowsByOrg,
  getWorkflowById,
} from "@/db/queries/automation.queries"

export const automationRouter = createTRPCRouter({
  list: orgProcedure.query(({ ctx }) => {
    return getWorkflowsByOrg(ctx.orgId)
  }),

  get: managerProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const workflow = await getWorkflowById(input.id, ctx.orgId)
      if (!workflow) throw new TRPCError({ code: "NOT_FOUND" })
      return workflow
    }),
})
