import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, orgProcedure, managerProcedure } from "../trpc";
import {
    getPipelinesByOrg,
    getPipelineById,
    getPipelineWithStages,
    getStagesByPipeline,
    createPipeline,
    createPipelineStage,
    updatePipeline,
    updatePipelineStage,
    deletePipelineStage,
    deletePipeline,
    getDefaultPipeline,
} from "@/db/queries/pipelines.queries";
import { createPipelineSchema, createStageSchema, updatePipelineSchema, updateStageSchema } from "@/lib/validations/pipeline";

export const pipelinesRouter = createTRPCRouter({
    list: orgProcedure.query(({ ctx }) => {
        return getPipelinesByOrg(ctx.orgId);
    }),

    getDefault: orgProcedure.query(({ ctx }) => {
        return getDefaultPipeline(ctx.orgId);
    }),

    get: orgProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const pipeline = await getPipelineById(input.id, ctx.orgId);
            if (!pipeline) throw new TRPCError({ code: "NOT_FOUND" });
            return pipeline;
        }),

    getWithStages: orgProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const pipeline = await getPipelineWithStages(input.id, ctx.orgId);
            if (!pipeline) throw new TRPCError({ code: "NOT_FOUND" });
            return pipeline;
        }),

    stages: orgProcedure
        .input(z.object({ pipelineId: z.string() }))
        .query(({ ctx, input }) => {
            return getStagesByPipeline(input.pipelineId, ctx.orgId);
        }),

    create: managerProcedure
        .input(
            createPipelineSchema
        )
        .mutation(({ ctx, input }) => {
            return createPipeline({ ...input, organizationId: ctx.orgId });
        }),

    createStage: managerProcedure
        .input(
            createStageSchema
        )
        .mutation(async ({ ctx, input }) => {
            const stage = await createPipelineStage(input, ctx.orgId);
            if (!stage) throw new TRPCError({ code: "NOT_FOUND", message: "Pipeline not found" });
            return stage;
        }),

    update: managerProcedure
        .input(
            updatePipelineSchema
        )
        .mutation(async ({ ctx, input }) => {
            const pipeline = await updatePipeline(input.id, ctx.orgId, input.data);
            if (!pipeline) throw new TRPCError({ code: "NOT_FOUND" });
            return pipeline;
        }),

    updateStage: managerProcedure
        .input(
            updateStageSchema
        )
        .mutation(async ({ ctx, input }) => {
            const stage = await updatePipelineStage(input.id, ctx.orgId, input.data);
            if (!stage) throw new TRPCError({ code: "NOT_FOUND" });
            return stage;
        }),

    deleteStage: managerProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const deleted = await deletePipelineStage(input.id, ctx.orgId);
            if (!deleted) throw new TRPCError({ code: "NOT_FOUND" });
            return { success: true };
        }),

    delete: managerProcedure
        .input(z.object({ id: z.string() }))
        .mutation(({ ctx, input }) => {
            return deletePipeline(input.id, ctx.orgId);
        }),
});