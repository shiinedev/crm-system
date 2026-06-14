import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, orgProcedure } from "../trpc";
import {
    getTasksByOrg,
    getTasksByAssignee,
    getTasksByDeal,
    getTasksByCompany,
    getTaskById,
    getOverdueTasks,
    createTask,
    updateTask,
    softDeleteTask,
} from "@/db/queries/tasks.queries";
import { createTaskSchema } from "@/lib/validations/tasks";



export const tasksRouter = createTRPCRouter({
    list: orgProcedure.query(({ ctx }) => {
        return getTasksByOrg(ctx.orgId);
    }),

    mine: orgProcedure.query(({ ctx }) => {
        return getTasksByAssignee(ctx.user.id, ctx.orgId);
    }),

    overdue: orgProcedure.query(({ ctx }) => {
        return getOverdueTasks(ctx.orgId);
    }),

    byDeal: orgProcedure
        .input(z.object({ dealId: z.string() }))
        .query(({ ctx, input }) => {
            return getTasksByDeal(input.dealId, ctx.orgId);
        }),

    byCompany: orgProcedure
        .input(z.object({ companyId: z.string() }))
        .query(({ ctx, input }) => {
            return getTasksByCompany(input.companyId, ctx.orgId);
        }),

    get: orgProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const task = await getTaskById(input.id, ctx.orgId);
            if (!task) throw new TRPCError({ code: "NOT_FOUND" });
            return task;
        }),

    create: orgProcedure
        .input(createTaskSchema)
        .mutation(({ ctx, input }) => {
            return createTask({
                ...input,
                organizationId: ctx.orgId,
                reminderAt: input.reminderAt ? new Date(input.reminderAt) : undefined,
                dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
            });
        }),

    update: orgProcedure
        .input(
            z.object({
                id: z.string(),
                data: createTaskSchema
                    .extend({
                        status: z.enum(["todo", "in_progress", "done", "cancelled"]).optional(),
                    })
                    .partial(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const task = await updateTask(input.id, ctx.orgId, {
                ...input.data,
                reminderAt: input.data.reminderAt ? new Date(input.data.reminderAt) : undefined,
                dueDate: input.data.dueDate ? new Date(input.data.dueDate) : undefined,
            });
            if (!task) throw new TRPCError({ code: "NOT_FOUND" });
            return task;
        }),

    delete: orgProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const task = await softDeleteTask(input.id, ctx.orgId);
            if (!task) throw new TRPCError({ code: "NOT_FOUND" });
            return task;
        }),
});