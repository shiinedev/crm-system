import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, orgProcedure, managerProcedure } from "../trpc";
import {
    getDealsByOrg,
    getDealsByPipeline,
    getDealsByStage,
    getDealsByCompany,
    getDealById,
    createDeal,
    updateDeal,
    updateDealStage,
    softDeleteDeal,
    getDealStats,
    getDealsByOwner,
} from "@/db/queries/deals.queries";
import { changeDealStageSchema, createDealSchema, updateDealSchema } from "@/lib/validations/deals";



export const dealsRouter = createTRPCRouter({
    list: orgProcedure.query(({ ctx }) => {
        return getDealsByOrg(ctx.orgId);
    }),

    byPipeline: orgProcedure
        .input(z.object({ pipelineId: z.string() }))
        .query(({ ctx, input }) => {
            return getDealsByPipeline(input.pipelineId, ctx.orgId);
        }),

    byStage: orgProcedure
        .input(z.object({ stageId: z.string() }))
        .query(({ ctx, input }) => {
            return getDealsByStage(input.stageId, ctx.orgId);
        }),

    byCompany: orgProcedure
        .input(z.object({ companyId: z.string() }))
        .query(({ ctx, input }) => {
            return getDealsByCompany(input.companyId, ctx.orgId);
        }),

    byOwner: orgProcedure
        .input(z.object({ ownerId: z.string() }))
        .query(({ ctx, input }) => {
            return getDealsByOwner(input.ownerId, ctx.orgId);
        }),

    get: orgProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const deal = await getDealById(input.id, ctx.orgId);
            if (!deal) throw new TRPCError({ code: "NOT_FOUND" });
            return deal;
        }),

    stats: orgProcedure.query(({ ctx }) => {
        return getDealStats(ctx.orgId);
    }),

    create: orgProcedure
        .input(createDealSchema)
        .mutation(({ ctx, input }) => {
            return createDeal({ ...input, organizationId: ctx.orgId });
        }),

    update: orgProcedure
        .input(updateDealSchema)
        .mutation(async ({ ctx, input }) => {
            const deal = await updateDeal(input.id, ctx.orgId, input);
            if (!deal) throw new TRPCError({ code: "NOT_FOUND" });
            return deal;
        }),

    changeStage: orgProcedure
        .input(changeDealStageSchema)
        .mutation(async ({ ctx, input }) => {
            const deal = await updateDealStage(input.id, ctx.orgId, input.stageId);
            if (!deal) throw new TRPCError({ code: "NOT_FOUND" });
            return deal;
        }),

    delete: managerProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const deal = await softDeleteDeal(input.id, ctx.orgId);
            if (!deal) throw new TRPCError({ code: "NOT_FOUND" });
            return deal;
        }),
});