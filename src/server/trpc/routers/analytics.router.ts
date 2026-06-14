import { z } from "zod";
import { createTRPCRouter, orgProcedure, managerProcedure } from "../trpc";
import {
    getRevenueByMonth,
    getPipelineHealthByStage,
    getDashboardSummary,
    getWinLossStats,
} from "@/db/queries/analytics.queries";

export const analyticsRouter = createTRPCRouter({
    dashboardSummary: orgProcedure.query(({ ctx }) => {
        return getDashboardSummary(ctx.orgId);
    }),

    revenueByMonth: managerProcedure
        .input(z.object({ months: z.number().min(1).max(24).default(12) }))
        .query(({ ctx, input }) => {
            return getRevenueByMonth(ctx.orgId, input.months);
        }),

    pipelineHealth: orgProcedure
        .input(z.object({ pipelineId: z.string() }))
        .query(({ ctx, input }) => {
            return getPipelineHealthByStage(input.pipelineId, ctx.orgId);
        }),

    winLoss: managerProcedure.query(({ ctx }) => {
        return getWinLossStats(ctx.orgId);
    }),
});