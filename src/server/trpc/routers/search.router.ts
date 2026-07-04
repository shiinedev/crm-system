import { z } from "zod"
import { createTRPCRouter, orgProcedure } from "../trpc"
import { searchCompanies } from "@/db/queries/companies.queries"
import { searchContacts } from "@/db/queries/contacts.queries"
import { searchDeals } from "@/db/queries/deals.queries"
import { searchDocuments } from "@/db/queries/documents.queries"
import { cacheGet, cacheSet } from "@/server/cache/reddis"
import { cacheKeys } from "@/server/cache/keys"

export const searchRouter = createTRPCRouter({
    global: orgProcedure
        .input(z.object({ q: z.string().min(1).max(100) }))
        .query(async ({ ctx, input }) => {
            const { q } = input
            const { orgId } = ctx

            const cacheKey = cacheKeys.search(orgId, q)
            const cached = await cacheGet<Awaited<ReturnType<typeof runSearch>>>(cacheKey)
            if (cached) return cached

            const result = await runSearch(orgId, q)
            await cacheSet(cacheKey, result, 30)
            return result
        }),
})

async function runSearch(orgId: string, q: string) {
    const [companies, contacts, deals, documents] = await Promise.all([
        searchCompanies(orgId, q),
        searchContacts(orgId, q),
        searchDeals(orgId, q),
        searchDocuments(orgId, q),
    ])

    return {
        companies: companies.map((c) => ({
            id: c.id,
            label: c.name,
            subtitle: c.industry ?? undefined,
            href: `/companies/${c.id}`,
            type: "company" as const,
        })),
        contacts: contacts.map((c) => ({
            id: c.id,
            label: `${c.firstName} ${c.lastName}`,
            subtitle: c.title ?? c.email ?? undefined,
            href: `/contacts/${c.id}`,
            type: "contact" as const,
        })),
        deals: deals.map((d) => ({
            id: d.id,
            label: d.title,
            subtitle: d.value ? `$${Number(d.value).toLocaleString()}` : undefined,
            href: `/deals/${d.id}`,
            type: "deal" as const,
        })),
        documents: documents.map((d) => ({
            id: d.id,
            label: d.title,
            subtitle: undefined,
            href: `/documents`,
            type: "document" as const,
        })),
    }
}