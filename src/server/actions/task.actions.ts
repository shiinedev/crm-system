"use server";

import { z } from "zod";
import { memberActionClient, ActionError } from "./safe-action";
import {
    createTask,
    updateTask,
    softDeleteTask,
} from "@/db/queries/tasks.queries";
import { createNotification } from "@/db/queries/notifications.queries";
import { createActivity } from "@/db/queries/activities.queries";
import { createTaskSchema, updateTaskSchema } from "@/lib/validations/tasks";
import { logAudit } from "@/server/audit";



export const createTaskAction = memberActionClient
    .inputSchema(createTaskSchema)
    .action(async ({ parsedInput, ctx }) => {
        const task = await createTask({
            ...parsedInput,
            organizationId: ctx.orgId,
            dueDate: parsedInput.dueDate ? new Date(parsedInput.dueDate) : undefined,
            reminderAt: parsedInput.reminderAt ? new Date(parsedInput.reminderAt) : undefined,
        });

        // Log activity if linked to a deal
        if (parsedInput.dealId) {
            await createActivity({
                organizationId: ctx.orgId,
                type: "task",
                title: `Task created: ${task.title}`,
                dealId: parsedInput.dealId,
                companyId: parsedInput.companyId ?? undefined,
                contactId: parsedInput.contactId ?? undefined,
                userId: ctx.user.id,
            });
        }

        // Notify assignee
        if (parsedInput.assignedToId && parsedInput.assignedToId !== ctx.user.id) {
            await createNotification({
                organizationId: ctx.orgId,
                userId: parsedInput.assignedToId,
                type: "assignment",
                title: "Task assigned to you",
                body: `"${task.title}" has been assigned to you.`,
                metadata: JSON.stringify({
                    taskId: task.id,
                    dueDate: parsedInput.dueDate,
                }),
            });
        }

        await logAudit({
            orgId: ctx.orgId,
            userId: ctx.user.id,
            action: "task.created",
            resourceType: "task",
            resourceId: task.id,
            after: task,
        });

        return { task };
    });

export const updateTaskAction = memberActionClient
    .inputSchema(updateTaskSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { id, ...data } = parsedInput;

        const task = await updateTask(id, ctx.orgId, {
            ...data,
            dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
            reminderAt: data.reminderAt ? new Date(data.reminderAt) : undefined,
        });

        if (!task) throw new ActionError("Task not found.");

        // Notify new assignee on reassignment
        if (data.assignedToId && data.assignedToId !== ctx.user.id) {
            await createNotification({
                organizationId: ctx.orgId,
                userId: data.assignedToId,
                type: "assignment",
                title: "Task assigned to you",
                body: `"${task.title}" has been assigned to you.`,
                metadata: JSON.stringify({ taskId: task.id }),
            });
        }

        // Notify deal owner when task is completed
        if (data.status === "done" && task.dealId) {
            await createActivity({
                organizationId: ctx.orgId,
                type: "task",
                title: `Task completed: ${task.title}`,
                dealId: task.dealId,
                userId: ctx.user.id,
            });
        }

        await logAudit({
            orgId: ctx.orgId,
            userId: ctx.user.id,
            action: "task.updated",
            resourceType: "task",
            resourceId: task.id,
            after: data,
        });

        return { task };
    });

export const deleteTaskAction = memberActionClient
    .inputSchema(z.object({ id: z.string() }))
    .action(async ({ parsedInput, ctx }) => {
        const task = await softDeleteTask(parsedInput.id, ctx.orgId);
        if (!task) throw new ActionError("Task not found.");
        await logAudit({
            orgId: ctx.orgId,
            userId: ctx.user.id,
            action: "task.deleted",
            resourceType: "task",
            resourceId: task.id,
            before: task,
        });
        return { task };
    });