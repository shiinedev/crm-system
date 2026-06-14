import { z } from "zod";
import { createTRPCRouter, orgProcedure } from "../trpc";
import {
    getActivitiesByDeal,
    getActivitiesByCompany,
    getActivitiesByContact,
    getRecentActivitiesByOrg,
    createActivity,
    deleteActivity,
} from "@/db/queries/activities.queries";
import { createActivitySchema } from "@/lib/validations/activity";

export const activitiesRouter = createTRPCRouter({
    byDeal: orgProcedure
        .input(z.object({ dealId: z.string() }))
        .query(({ ctx, input }) => {
            return getActivitiesByDeal(input.dealId, ctx.orgId);
        }),

    byCompany: orgProcedure
        .input(z.object({ companyId: z.string() }))
        .query(({ ctx, input }) => {
            return getActivitiesByCompany(input.companyId, ctx.orgId);
        }),

    byContact: orgProcedure
        .input(z.object({ contactId: z.string() }))
        .query(({ ctx, input }) => {
            return getActivitiesByContact(input.contactId, ctx.orgId);
        }),

    recent: orgProcedure
        .input(z.object({ limit: z.number().min(1).max(50).default(20) }))
        .query(({ ctx, input }) => {
            return getRecentActivitiesByOrg(ctx.orgId, input.limit);
        }),

    create: orgProcedure
        .input(
            createActivitySchema
        )
        .mutation(({ ctx, input }) => {
            return createActivity({
                ...input,
                organizationId: ctx.orgId,
                userId: ctx.user.id,
            });
        }),

    delete: orgProcedure
        .input(z.object({ id: z.string() }))
        .mutation(({ ctx, input }) => {
            return deleteActivity(input.id, ctx.orgId);
        }),
});