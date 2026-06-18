import "server-only"
import { eq, and, isNull, ilike, desc } from "drizzle-orm"
import { db } from "@/db"
import { documents, type NewDocument } from "@/db/schema"

export async function getDocumentsByOrg(organizationId: string) {
  return db
    .select()
    .from(documents)
    .where(and(eq(documents.organizationId, organizationId), isNull(documents.deletedAt)))
    .orderBy(desc(documents.createdAt))
}

export async function getDocumentsByCompany(companyId: string, organizationId: string) {
  return db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.companyId, companyId),
        eq(documents.organizationId, organizationId),
        isNull(documents.deletedAt)
      )
    )
    .orderBy(desc(documents.createdAt))
}

export async function getDocumentsByDeal(dealId: string, organizationId: string) {
  return db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.dealId, dealId),
        eq(documents.organizationId, organizationId),
        isNull(documents.deletedAt)
      )
    )
    .orderBy(desc(documents.createdAt))
}

export async function getDocumentById(id: string, organizationId: string) {
  const [doc] = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.id, id),
        eq(documents.organizationId, organizationId),
        isNull(documents.deletedAt)
      )
    )
    .limit(1)
  return doc ?? null
}

export async function searchDocuments(organizationId: string, query: string) {
  return db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.organizationId, organizationId),
        isNull(documents.deletedAt),
        ilike(documents.title, `%${query}%`)
      )
    )
    .orderBy(desc(documents.createdAt))
    .limit(20)
}

export async function createDocument(data: NewDocument) {
  const [doc] = await db.insert(documents).values(data).returning()
  return doc
}

export async function updateDocument(id: string, organizationId: string, data: Partial<NewDocument>) {
  const [doc] = await db
    .update(documents)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(documents.id, id), eq(documents.organizationId, organizationId)))
    .returning()
  return doc ?? null
}

export async function softDeleteDocument(id: string, organizationId: string) {
  const [doc] = await db
    .update(documents)
    .set({ deletedAt: new Date() })
    .where(and(eq(documents.id, id), eq(documents.organizationId, organizationId)))
    .returning()
  return doc ?? null
}
