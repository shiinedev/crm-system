"use server";

import { z } from "zod";
import { managerActionClient, ActionError } from "./safe-action";
import {
    createPipeline,
    createPipelineStage,
    updatePipeline,
    updatePipelineStage,
    deletePipelineStage,
    deletePipeline,
} from "@/db/queries/pipelines.queries";
import { createPipelineSchema, createStageSchema, updatePipelineSchema, updateStageSchema } from "@/lib/validations/pipeline";

export const createPipelineAction = managerActionClient
    .inputSchema(createPipelineSchema)
    .action(async ({ parsedInput, ctx }) => {
        const pipeline = await createPipeline({
            ...parsedInput,
            organizationId: ctx.orgId,
        });
        return { pipeline };
    });

export const createPipelineStageAction = managerActionClient
    .inputSchema(createStageSchema)
    .action(async ({ parsedInput }) => {
        const stage = await createPipelineStage(parsedInput);
        return { stage };
    });

export const updatePipelineAction = managerActionClient
    .inputSchema(updatePipelineSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { id, ...data } = parsedInput;
        const pipeline = await updatePipeline(id, ctx.orgId, data.data);
        if (!pipeline) throw new ActionError("Pipeline not found.");
        return { pipeline };
    });

export const updatePipelineStageAction = managerActionClient
    .inputSchema(updateStageSchema)
    .action(async ({ parsedInput }) => {
        const { id, ...data } = parsedInput;
        const stage = await updatePipelineStage(id, data.data);
        if (!stage) throw new ActionError("Stage not found.");
        return { stage };
    });

export const deletePipelineStageAction = managerActionClient
    .inputSchema(z.object({ id: z.string() }))
    .action(async ({ parsedInput }) => {
        await deletePipelineStage(parsedInput.id);
        return { success: true };
    });

export const deletePipelineAction = managerActionClient
    .inputSchema(z.object({ id: z.string() }))
    .action(async ({ parsedInput, ctx }) => {
        await deletePipeline(parsedInput.id, ctx.orgId);
        return { success: true };
    });