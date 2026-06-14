import "server-only";
import { eq, and, isNull, ilike, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { contacts, type NewContact } from "@/db/schema";

export async function getContactsByOrg(organizationId: string) {
    return db
        .select()
        .from(contacts)
        .where(and(eq(contacts.organizationId, organizationId), isNull(contacts.deletedAt)))
        .orderBy(desc(contacts.createdAt));
}

export async function getContactsByCompany(
    companyId: string,
    organizationId: string
) {
    return db
        .select()
        .from(contacts)
        .where(
            and(
                eq(contacts.companyId, companyId),
                eq(contacts.organizationId, organizationId),
                isNull(contacts.deletedAt)
            )
        )
        .orderBy(desc(contacts.createdAt));
}

export async function getContactById(id: string, organizationId: string) {
    const [contact] = await db
        .select()
        .from(contacts)
        .where(
            and(
                eq(contacts.id, id),
                eq(contacts.organizationId, organizationId),
                isNull(contacts.deletedAt)
            )
        )
        .limit(1);
    return contact ?? null;
}

export async function searchContacts(organizationId: string, query: string) {
    return db
        .select()
        .from(contacts)
        .where(
            and(
                eq(contacts.organizationId, organizationId),
                isNull(contacts.deletedAt),
                ilike(contacts.firstName, `%${query}%`)
            )
        )
        .orderBy(desc(contacts.createdAt))
        .limit(20);
}

export async function createContact(data: NewContact) {
    const [contact] = await db.insert(contacts).values(data).returning();
    return contact;
}

export async function updateContact(
    id: string,
    organizationId: string,
    data: Partial<Omit<NewContact, "id" | "organizationId">>
) {
    const [contact] = await db
        .update(contacts)
        .set({ ...data, updatedAt: new Date() })
        .where(
            and(eq(contacts.id, id), eq(contacts.organizationId, organizationId))
        )
        .returning();
    return contact ?? null;
}

export async function softDeleteContact(id: string, organizationId: string) {
    const [contact] = await db
        .update(contacts)
        .set({ deletedAt: new Date() })
        .where(
            and(eq(contacts.id, id), eq(contacts.organizationId, organizationId))
        )
        .returning();
    return contact ?? null;
}

export async function getContactCount(organizationId: string) {
    const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(contacts)
        .where(
            and(eq(contacts.organizationId, organizationId), isNull(contacts.deletedAt))
        );
    return result?.count ?? 0;
}

export async function updateContactLastInteraction(
    id: string,
    organizationId: string
) {
    const [contact] = await db
        .update(contacts)
        .set({ lastInteractionAt: new Date(), updatedAt: new Date() })
        .where(
            and(eq(contacts.id, id), eq(contacts.organizationId, organizationId))
        )
        .returning();
    return contact ?? null;
}