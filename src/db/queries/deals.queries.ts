import "server-only";
import { eq, and, isNull, desc, sql, ne } from "drizzle-orm";
import { db } from "@/db";
import { deals, pipelineStages, type NewDeal } from "@/db/schema";

export async function getDealsByOrg(organizationId: string) {
  return db
    .select()
    .from(deals)
    .where(and(eq(deals.organizationId, organizationId), isNull(deals.deletedAt)))
    .orderBy(desc(deals.createdAt));
}

export async function getDealsByPipeline(
  pipelineId: string,
  organizationId: string
) {
  return db
    .select()
    .from(deals)
    .where(
      and(
        eq(deals.pipelineId, pipelineId),
        eq(deals.organizationId, organizationId),
        isNull(deals.deletedAt)
      )
    )
    .orderBy(desc(deals.createdAt));
}

export async function getDealsByStage(stageId: string, organizationId: string) {
  return db
    .select()
    .from(deals)
    .where(
      and(
        eq(deals.stageId, stageId),
        eq(deals.organizationId, organizationId),
        isNull(deals.deletedAt)
      )
    )
    .orderBy(desc(deals.createdAt));
}

export async function getDealsByCompany(
  companyId: string,
  organizationId: string
) {
  return db
    .select()
    .from(deals)
    .where(
      and(
        eq(deals.companyId, companyId),
        eq(deals.organizationId, organizationId),
        isNull(deals.deletedAt)
      )
    )
    .orderBy(desc(deals.createdAt));
}

export async function getDealById(id: string, organizationId: string) {
  const [deal] = await db
    .select()
    .from(deals)
    .where(
      and(
        eq(deals.id, id),
        eq(deals.organizationId, organizationId),
        isNull(deals.deletedAt)
      )
    )
    .limit(1);
  return deal ?? null;
}

export async function createDeal(data: NewDeal) {
  const [deal] = await db.insert(deals).values(data).returning();
  return deal;
}

export async function updateDeal(
  id: string,
  organizationId: string,
  data: Partial<NewDeal>
) {
  const [deal] = await db
    .update(deals)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(deals.id, id), eq(deals.organizationId, organizationId)))
    .returning();
  return deal ?? null;
}

export async function updateDealStage(
  id: string,
  organizationId: string,
  stageId: string
) {
  const [deal] = await db
    .update(deals)
    .set({ stageId, updatedAt: new Date() })
    .where(and(eq(deals.id, id), eq(deals.organizationId, organizationId)))
    .returning();
  return deal ?? null;
}

export async function softDeleteDeal(id: string, organizationId: string) {
  const [deal] = await db
    .update(deals)
    .set({ deletedAt: new Date() })
    .where(and(eq(deals.id, id), eq(deals.organizationId, organizationId)))
    .returning();
  return deal ?? null;
}

export async function getDealStats(organizationId: string) {
  const [result] = await db
    .select({
      totalDeals: sql<number>`count(*)::int`,
      totalValue: sql<number>`coalesce(sum(${deals.value}::numeric), 0)::numeric`,
      avgProbability: sql<number>`coalesce(avg(${deals.probability}), 0)::int`,
    })
    .from(deals)
    .where(
      and(eq(deals.organizationId, organizationId), isNull(deals.deletedAt))
    );
  return result;
}

export async function getDealsByOwner(ownerId: string, organizationId: string) {
  return db
    .select()
    .from(deals)
    .where(
      and(
        eq(deals.ownerId, ownerId),
        eq(deals.organizationId, organizationId),
        isNull(deals.deletedAt)
      )
    )
    .orderBy(desc(deals.createdAt));
}