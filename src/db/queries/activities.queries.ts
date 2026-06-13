import "server-only";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { activities, type NewActivity } from "@/db/schema";

export async function getActivitiesByDeal(
    dealId: string,
    organizationId: string
) {
    return db
        .select()
        .from(activities)
        .where(
            and(
                eq(activities.dealId, dealId),
                eq(activities.organizationId, organizationId)
            )
        )
        .orderBy(desc(activities.createdAt));
}

export async function getActivitiesByCompany(
    companyId: string,
    organizationId: string
) {
    return db
        .select()
        .from(activities)
        .where(
            and(
                eq(activities.companyId, companyId),
                eq(activities.organizationId, organizationId)
            )
        )
        .orderBy(desc(activities.createdAt));
}

export async function getActivitiesByContact(
    contactId: string,
    organizationId: string
) {
    return db
        .select()
        .from(activities)
        .where(
            and(
                eq(activities.contactId, contactId),
                eq(activities.organizationId, organizationId)
            )
        )
        .orderBy(desc(activities.createdAt));
}

export async function getRecentActivitiesByOrg(
    organizationId: string,
    limit = 20
) {
    return db
        .select()
        .from(activities)
        .where(eq(activities.organizationId, organizationId))
        .orderBy(desc(activities.createdAt))
        .limit(limit);
}

export async function createActivity(data: NewActivity) {
    const [activity] = await db.insert(activities).values(data).returning();
    return activity;
}

export async function deleteActivity(id: string, organizationId: string) {
    await db
        .delete(activities)
        .where(
            and(
                eq(activities.id, id),
                eq(activities.organizationId, organizationId)
            )
        );
}