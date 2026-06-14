import "server-only";
import { eq, and, isNull, desc, lte } from "drizzle-orm";
import { db } from "@/db";
import { tasks, type NewTask } from "@/db/schema";

export async function getTasksByOrg(organizationId: string) {
    return db
        .select()
        .from(tasks)
        .where(and(eq(tasks.organizationId, organizationId), isNull(tasks.deletedAt)))
        .orderBy(desc(tasks.createdAt));
}

export async function getTasksByAssignee(
    assignedToId: string,
    organizationId: string
) {
    return db
        .select()
        .from(tasks)
        .where(
            and(
                eq(tasks.assignedToId, assignedToId),
                eq(tasks.organizationId, organizationId),
                isNull(tasks.deletedAt)
            )
        )
        .orderBy(desc(tasks.createdAt));
}

export async function getTasksByDeal(dealId: string, organizationId: string) {
    return db
        .select()
        .from(tasks)
        .where(
            and(
                eq(tasks.dealId, dealId),
                eq(tasks.organizationId, organizationId),
                isNull(tasks.deletedAt)
            )
        )
        .orderBy(desc(tasks.createdAt));
}

export async function getTasksByCompany(
    companyId: string,
    organizationId: string
) {
    return db
        .select()
        .from(tasks)
        .where(
            and(
                eq(tasks.companyId, companyId),
                eq(tasks.organizationId, organizationId),
                isNull(tasks.deletedAt)
            )
        )
        .orderBy(desc(tasks.createdAt));
}

export async function getTaskById(id: string, organizationId: string) {
    const [task] = await db
        .select()
        .from(tasks)
        .where(
            and(
                eq(tasks.id, id),
                eq(tasks.organizationId, organizationId),
                isNull(tasks.deletedAt)
            )
        )
        .limit(1);
    return task ?? null;
}

export async function getOverdueTasks(organizationId: string) {
    return db
        .select()
        .from(tasks)
        .where(
            and(
                eq(tasks.organizationId, organizationId),
                isNull(tasks.deletedAt),
                lte(tasks.dueDate, new Date())
            )
        )
        .orderBy(desc(tasks.dueDate));
}

export async function createTask(data: NewTask) {
    const [task] = await db.insert(tasks).values(data).returning();
    return task;
}

export async function updateTask(
    id: string,
    organizationId: string,
    data: Partial<Omit<NewTask, "id" | "organizationId">>
) {
    const [task] = await db
        .update(tasks)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(tasks.id, id), eq(tasks.organizationId, organizationId)))
        .returning();
    return task ?? null;
}

export async function softDeleteTask(id: string, organizationId: string) {
    const [task] = await db
        .update(tasks)
        .set({ deletedAt: new Date() })
        .where(and(eq(tasks.id, id), eq(tasks.organizationId, organizationId)))
        .returning();
    return task ?? null;
}

export async function getTasksByContact(contactId: string, organizationId: string) {
    return db
        .select()
        .from(tasks)
        .where(
            and(
                eq(tasks.contactId, contactId),
                eq(tasks.organizationId, organizationId),
                isNull(tasks.deletedAt)
            )
        )
        .orderBy(desc(tasks.createdAt))
}