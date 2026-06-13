import "server-only";
import { eq, and, isNull, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { deals, companies, contacts, tasks } from "@/db/schema";

export async function getRevenueByMonth(
    organizationId: string,
    months = 12
) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    return db
        .select({
            month: sql<string>`to_char(${deals.createdAt}, 'YYYY-MM')`,
            totalValue: sql<number>`coalesce(sum(${deals.value}::numeric), 0)`,
            dealCount: sql<number>`count(*)::int`,
        })
        .from(deals)
        .where(
            and(
                eq(deals.organizationId, organizationId),
                isNull(deals.deletedAt),
                gte(deals.createdAt, since)
            )
        )
        .groupBy(sql`to_char(${deals.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${deals.createdAt}, 'YYYY-MM')`);
}

export async function getPipelineHealthByStage(
    pipelineId: string,
    organizationId: string
) {
    return db
        .select({
            stageId: deals.stageId,
            dealCount: sql<number>`count(*)::int`,
            totalValue: sql<number>`coalesce(sum(${deals.value}::numeric), 0)`,
        })
        .from(deals)
        .where(
            and(
                eq(deals.pipelineId, pipelineId),
                eq(deals.organizationId, organizationId),
                isNull(deals.deletedAt)
            )
        )
        .groupBy(deals.stageId);
}

export async function getDashboardSummary(organizationId: string) {
    const [companiesCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(companies)
        .where(
            and(
                eq(companies.organizationId, organizationId),
                isNull(companies.deletedAt)
            )
        );

    const [contactsCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(contacts)
        .where(
            and(
                eq(contacts.organizationId, organizationId),
                isNull(contacts.deletedAt)
            )
        );

    const [dealStats] = await db
        .select({
            count: sql<number>`count(*)::int`,
            totalValue: sql<number>`coalesce(sum(${deals.value}::numeric), 0)`,
        })
        .from(deals)
        .where(
            and(eq(deals.organizationId, organizationId), isNull(deals.deletedAt))
        );

    const [openTasks] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(tasks)
        .where(
            and(
                eq(tasks.organizationId, organizationId),
                isNull(tasks.deletedAt),
                eq(tasks.status, "todo")
            )
        );

    return {
        companies: companiesCount?.count ?? 0,
        contacts: contactsCount?.count ?? 0,
        deals: dealStats?.count ?? 0,
        dealValue: dealStats?.totalValue ?? 0,
        openTasks: openTasks?.count ?? 0,
    };
}

export async function getWinLossStats(organizationId: string) {
    return db
        .select({
            forecastCategory: deals.forecastCategory,
            count: sql<number>`count(*)::int`,
            totalValue: sql<number>`coalesce(sum(${deals.value}::numeric), 0)`,
        })
        .from(deals)
        .where(
            and(eq(deals.organizationId, organizationId), isNull(deals.deletedAt))
        )
        .groupBy(deals.forecastCategory);
}