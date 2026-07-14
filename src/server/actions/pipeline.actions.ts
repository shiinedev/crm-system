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
    getPipelineById,
    getStageById,
} from "@/db/queries/pipelines.queries";
import { createPipelineSchema, createStageSchema, updatePipelineSchema, updateStageSchema } from "@/lib/validations/pipeline";
import { logAudit } from "@/server/audit";

/** Stage ids arrive from the client — verify the stage's pipeline belongs to this org. */
async function assertStageInOrg(stageId: string, orgId: string) {
    const stage = await getStageById(stageId);
    if (!stage) throw new ActionError("Stage not found.");
    const pipeline = await getPipelineById(stage.pipelineId, orgId);
    if (!pipeline) throw new ActionError("Stage not found.");
    return stage;
}

export const createPipelineAction = managerActionClient
    .inputSchema(createPipelineSchema)
    .action(async ({ parsedInput, ctx }) => {
        const pipeline = await createPipeline({
            ...parsedInput,
            organizationId: ctx.orgId,
        });
        await logAudit({
            orgId: ctx.orgId,
            userId: ctx.user.id,
            action: "pipeline.created",
            resourceType: "pipeline",
            resourceId: pipeline.id,
            after: pipeline,
        });
        return { pipeline };
    });

export const createPipelineStageAction = managerActionClient
    .inputSchema(createStageSchema)
    .action(async ({ parsedInput, ctx }) => {
        const pipeline = await getPipelineById(parsedInput.pipelineId, ctx.orgId);
        if (!pipeline) throw new ActionError("Pipeline not found.");
        const stage = await createPipelineStage(parsedInput);
        await logAudit({
            orgId: ctx.orgId,
            userId: ctx.user.id,
            action: "pipeline_stage.created",
            resourceType: "pipeline_stage",
            resourceId: stage.id,
            after: stage,
        });
        return { stage };
    });

export const updatePipelineAction = managerActionClient
    .inputSchema(updatePipelineSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { id, ...data } = parsedInput;
        const pipeline = await updatePipeline(id, ctx.orgId, data.data);
        if (!pipeline) throw new ActionError("Pipeline not found.");
        await logAudit({
            orgId: ctx.orgId,
            userId: ctx.user.id,
            action: "pipeline.updated",
            resourceType: "pipeline",
            resourceId: pipeline.id,
            after: data.data,
        });
        return { pipeline };
    });

export const updatePipelineStageAction = managerActionClient
    .inputSchema(updateStageSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { id, ...data } = parsedInput;
        await assertStageInOrg(id, ctx.orgId);
        const stage = await updatePipelineStage(id, data.data);
        if (!stage) throw new ActionError("Stage not found.");
        await logAudit({
            orgId: ctx.orgId,
            userId: ctx.user.id,
            action: "pipeline_stage.updated",
            resourceType: "pipeline_stage",
            resourceId: stage.id,
            after: data.data,
        });
        return { stage };
    });

export const deletePipelineStageAction = managerActionClient
    .inputSchema(z.object({ id: z.string() }))
    .action(async ({ parsedInput, ctx }) => {
        const stage = await assertStageInOrg(parsedInput.id, ctx.orgId);
        await deletePipelineStage(parsedInput.id);
        await logAudit({
            orgId: ctx.orgId,
            userId: ctx.user.id,
            action: "pipeline_stage.deleted",
            resourceType: "pipeline_stage",
            resourceId: parsedInput.id,
            before: stage,
        });
        return { success: true };
    });

export const deletePipelineAction = managerActionClient
    .inputSchema(z.object({ id: z.string() }))
    .action(async ({ parsedInput, ctx }) => {
        await deletePipeline(parsedInput.id, ctx.orgId);
        await logAudit({
            orgId: ctx.orgId,
            userId: ctx.user.id,
            action: "pipeline.deleted",
            resourceType: "pipeline",
            resourceId: parsedInput.id,
        });
        return { success: true };
    });
