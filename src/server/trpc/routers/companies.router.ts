import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, orgProcedure, memberProcedure, managerProcedure } from "../trpc";
import {
    getCompaniesByOrg,
    getCompanyById,
    searchCompanies,
    createCompany,
    updateCompany,
    softDeleteCompany,
    getCompanyCount,
} from "@/db/queries/companies.queries";
import { createCompanySchema, updateCompanySchema } from "@/lib/validations/companies";
import { toPage } from "@/db/queries/pagination";
import { listInputSchema, DEFAULT_PAGE_SIZE } from "./list-input";



export const companiesRouter = createTRPCRouter({
    list: orgProcedure
        .input(listInputSchema)
        .query(async ({ ctx, input }) => {
            const limit = input?.limit ?? DEFAULT_PAGE_SIZE;
            const rows = await getCompaniesByOrg(ctx.orgId, {
                limit: limit + 1,
                cursor: input?.cursor ?? undefined,
            });
            return toPage(rows, limit);
        }),

    search: orgProcedure
        .input(z.object({ query: z.string().min(1) }))
        .query(({ ctx, input }) => {
            return searchCompanies(ctx.orgId, input.query);
        }),

    get: orgProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const company = await getCompanyById(input.id, ctx.orgId);
            if (!company) throw new TRPCError({ code: "NOT_FOUND" });
            return company;
        }),

    count: orgProcedure.query(({ ctx }) => {
        return getCompanyCount(ctx.orgId);
    }),

    create: memberProcedure
        .input(createCompanySchema)
        .mutation(({ ctx, input }) => {
            return createCompany({ ...input, organizationId: ctx.orgId });
        }),

    update: memberProcedure
        .input(updateCompanySchema)
        .mutation(async ({ ctx, input }) => {
            const company = await updateCompany(input.id, ctx.orgId, input);
            if (!company) throw new TRPCError({ code: "NOT_FOUND" });
            return company;
        }),

    delete: managerProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const company = await softDeleteCompany(input.id, ctx.orgId);
            if (!company) throw new TRPCError({ code: "NOT_FOUND" });
            return company;
        }),
});