import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, orgProcedure, memberProcedure, managerProcedure } from "../trpc";
import {
    getContactsByOrg,
    getContactsByCompany,
    getContactById,
    searchContacts,
    createContact,
    updateContact,
    softDeleteContact,
    getContactCount,
} from "@/db/queries/contacts.queries";
import { createContactSchema, updateContactSchema } from "@/lib/validations/contacts";
import { toPage } from "@/db/queries/pagination";
import { listInputSchema, DEFAULT_PAGE_SIZE } from "./list-input";



export const contactsRouter = createTRPCRouter({
    list: orgProcedure
        .input(listInputSchema)
        .query(async ({ ctx, input }) => {
            const limit = input?.limit ?? DEFAULT_PAGE_SIZE;
            const rows = await getContactsByOrg(ctx.orgId, {
                limit: limit + 1,
                cursor: input?.cursor ?? undefined,
            });
            return toPage(rows, limit);
        }),

    byCompany: orgProcedure
        .input(z.object({ companyId: z.string() }))
        .query(({ ctx, input }) => {
            return getContactsByCompany(input.companyId, ctx.orgId);
        }),

    search: orgProcedure
        .input(z.object({ query: z.string().min(1) }))
        .query(({ ctx, input }) => {
            return searchContacts(ctx.orgId, input.query);
        }),

    get: orgProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const contact = await getContactById(input.id, ctx.orgId);
            if (!contact) throw new TRPCError({ code: "NOT_FOUND" });
            return contact;
        }),

    count: orgProcedure.query(({ ctx }) => {
        return getContactCount(ctx.orgId);
    }),

    create: memberProcedure
        .input(createContactSchema)
        .mutation(({ ctx, input }) => {
            return createContact({ ...input, organizationId: ctx.orgId });
        }),

    update: memberProcedure
        .input(z.object({ id: z.string(), data: updateContactSchema }))
        .mutation(async ({ ctx, input }) => {
            const contact = await updateContact(input.id, ctx.orgId, input.data);
            if (!contact) throw new TRPCError({ code: "NOT_FOUND" });
            return contact;
        }),

    delete: managerProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const contact = await softDeleteContact(input.id, ctx.orgId);
            if (!contact) throw new TRPCError({ code: "NOT_FOUND" });
            return contact;
        }),
});