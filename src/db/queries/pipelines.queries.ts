import "server-only";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/db";
import {
    pipelines,
    pipelineStages,
    type NewPipeline,
    type NewPipelineStage,
} from "@/db/schema";

export async function getPipelinesByOrg(organizationId: string) {
    return db
        .select()
        .from(pipelines)
        .where(eq(pipelines.organizationId, organizationId))
        .orderBy(asc(pipelines.createdAt));
}

export async function getDefaultPipeline(organizationId: string) {
    const [pipeline] = await db
        .select()
        .from(pipelines)
        .where(
            and(
                eq(pipelines.organizationId, organizationId),
                eq(pipelines.isDefault, true)
            )
        )
        .limit(1);
    return pipeline ?? null;
}

export async function getPipelineById(id: string, organizationId: string) {
    const [pipeline] = await db
        .select()
        .from(pipelines)
        .where(
            and(
                eq(pipelines.id, id),
                eq(pipelines.organizationId, organizationId)
            )
        )
        .limit(1);
    return pipeline ?? null;
}

export async function getPipelineWithStages(
    pipelineId: string,
    organizationId: string
) {
    const pipeline = await getPipelineById(pipelineId, organizationId);
    if (!pipeline) return null;
    const stages = await getStagesByPipeline(pipelineId, organizationId);
    return { ...pipeline, stages };
}

// SECURITY: stages have no organizationId column — tenancy is inherited through
// their pipeline. Every stage read/write below therefore joins (or pre-checks)
// pipelines.organizationId so a stage id from another org can never be
// read or mutated, no matter what the caller passes.

export async function getStagesByPipeline(pipelineId: string, organizationId: string) {
    return db
        .select({ stage: pipelineStages })
        .from(pipelineStages)
        .innerJoin(pipelines, eq(pipelineStages.pipelineId, pipelines.id))
        .where(
            and(
                eq(pipelineStages.pipelineId, pipelineId),
                eq(pipelines.organizationId, organizationId)
            )
        )
        .orderBy(asc(pipelineStages.order))
        .then((rows) => rows.map((r) => r.stage));
}

export async function getStageById(id: string, organizationId: string) {
    const [row] = await db
        .select({ stage: pipelineStages })
        .from(pipelineStages)
        .innerJoin(pipelines, eq(pipelineStages.pipelineId, pipelines.id))
        .where(
            and(
                eq(pipelineStages.id, id),
                eq(pipelines.organizationId, organizationId)
            )
        )
        .limit(1);
    return row?.stage ?? null;
}

export async function createPipeline(data: NewPipeline) {
    const [pipeline] = await db.insert(pipelines).values(data).returning();
    return pipeline;
}

export async function createPipelineStage(
    data: NewPipelineStage,
    organizationId: string
) {
    // Refuse to attach a stage to a pipeline the org doesn't own.
    const pipeline = await getPipelineById(data.pipelineId, organizationId);
    if (!pipeline) return null;
    const [stage] = await db.insert(pipelineStages).values(data).returning();
    return stage;
}

export async function updatePipeline(
    id: string,
    organizationId: string,
    data: Partial<NewPipeline>
) {
    const [pipeline] = await db
        .update(pipelines)
        .set({ ...data, updatedAt: new Date() })
        .where(
            and(eq(pipelines.id, id), eq(pipelines.organizationId, organizationId))
        )
        .returning();
    return pipeline ?? null;
}

export async function updatePipelineStage(
    id: string,
    organizationId: string,
    data: Partial<NewPipelineStage>
) {
    const existing = await getStageById(id, organizationId);
    if (!existing) return null;
    const [stage] = await db
        .update(pipelineStages)
        .set(data)
        .where(eq(pipelineStages.id, id))
        .returning();
    return stage ?? null;
}

export async function deletePipelineStage(id: string, organizationId: string) {
    const existing = await getStageById(id, organizationId);
    if (!existing) return false;
    await db.delete(pipelineStages).where(eq(pipelineStages.id, id));
    return true;
}

export async function deletePipeline(id: string, organizationId: string) {
    await db
        .delete(pipelines)
        .where(
            and(eq(pipelines.id, id), eq(pipelines.organizationId, organizationId))
        );
}