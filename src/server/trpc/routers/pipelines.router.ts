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
        .query(({ input }) => {
            return getStagesByPipeline(input.pipelineId);
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
        .mutation(({ input }) => {
            return createPipelineStage(input);
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
        .mutation(({ input }) => {
            return updatePipelineStage(input.id, input.data);
        }),

    deleteStage: managerProcedure
        .input(z.object({ id: z.string() }))
        .mutation(({ input }) => {
            return deletePipelineStage(input.id);
        }),

    delete: managerProcedure
        .input(z.object({ id: z.string() }))
        .mutation(({ ctx, input }) => {
            return deletePipeline(input.id, ctx.orgId);
        }),
});