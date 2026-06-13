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
    const stages = await getStagesByPipeline(pipelineId);
    return { ...pipeline, stages };
}

export async function getStagesByPipeline(pipelineId: string) {
    return db
        .select()
        .from(pipelineStages)
        .where(eq(pipelineStages.pipelineId, pipelineId))
        .orderBy(asc(pipelineStages.order));
}

export async function getStageById(id: string) {
    const [stage] = await db
        .select()
        .from(pipelineStages)
        .where(eq(pipelineStages.id, id))
        .limit(1);
    return stage ?? null;
}

export async function createPipeline(data: NewPipeline) {
    const [pipeline] = await db.insert(pipelines).values(data).returning();
    return pipeline;
}

export async function createPipelineStage(data: NewPipelineStage) {
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
    data: Partial<NewPipelineStage>
) {
    const [stage] = await db
        .update(pipelineStages)
        .set(data)
        .where(eq(pipelineStages.id, id))
        .returning();
    return stage ?? null;
}

export async function deletePipelineStage(id: string) {
    await db.delete(pipelineStages).where(eq(pipelineStages.id, id));
}

export async function deletePipeline(id: string, organizationId: string) {
    await db
        .delete(pipelines)
        .where(
            and(eq(pipelines.id, id), eq(pipelines.organizationId, organizationId))
        );
}