import "server-only";
import { eq, and, isNull, ilike, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { companies, type NewCompany } from "@/db/schema";

export async function getCompaniesByOrg(organizationId: string) {
    return db
        .select()
        .from(companies)
        .where(and(eq(companies.organizationId, organizationId), isNull(companies.deletedAt)))
        .orderBy(desc(companies.createdAt));
}

export async function getCompanyById(id: string, organizationId: string) {
    const [company] = await db
        .select()
        .from(companies)
        .where(
            and(
                eq(companies.id, id),
                eq(companies.organizationId, organizationId),
                isNull(companies.deletedAt)
            )
        )
        .limit(1);
    return company ?? null;
}

export async function searchCompanies(organizationId: string, query: string) {
    return db
        .select()
        .from(companies)
        .where(
            and(
                eq(companies.organizationId, organizationId),
                isNull(companies.deletedAt),
                ilike(companies.name, `%${query}%`)
            )
        )
        .orderBy(desc(companies.createdAt))
        .limit(20);
}

export async function createCompany(data: NewCompany) {
    const [company] = await db.insert(companies).values(data).returning();
    return company;
}

export async function updateCompany(
    id: string,
    organizationId: string,
    data: Partial<NewCompany>
) {
    const [company] = await db
        .update(companies)
        .set({ ...data, updatedAt: new Date() })
        .where(
            and(eq(companies.id, id), eq(companies.organizationId, organizationId))
        )
        .returning();
    return company ?? null;
}

export async function softDeleteCompany(id: string, organizationId: string) {
    const [company] = await db
        .update(companies)
        .set({ deletedAt: new Date() })
        .where(
            and(eq(companies.id, id), eq(companies.organizationId, organizationId))
        )
        .returning();
    return company ?? null;
}

export async function getCompanyCount(organizationId: string) {
    const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(companies)
        .where(
            and(eq(companies.organizationId, organizationId), isNull(companies.deletedAt))
        );
    return result?.count ?? 0;
}