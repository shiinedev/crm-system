"use server";

import { z } from "zod";
import { memberActionClient, managerActionClient, ActionError } from "./safe-action";
import {
    createDeal,
    updateDeal,
    updateDealStage,
    softDeleteDeal,
    getDealById,
} from "@/db/queries/deals.queries";
import { getStageById } from "@/db/queries/pipelines.queries";
import { createNotification } from "@/db/queries/notifications.queries";
import { createActivity } from "@/db/queries/activities.queries";
import { changeDealStageSchema, createDealSchema, updateDealSchema } from "@/lib/validations/deals";
import { sendEvent, dealCreatedEvent, dealStageChangedEvent } from "@/server/inngest/client";
import { logAudit } from "@/server/audit";



export const createDealAction = memberActionClient
    .inputSchema(createDealSchema)
    .action(async ({ parsedInput, ctx }) => {
        const deal = await createDeal({
            ...parsedInput,
            organizationId: ctx.orgId,
        });

        // Log activity
        await createActivity({
            organizationId: ctx.orgId,
            type: "status_change",
            title: "Deal created",
            dealId: deal.id,
            userId: ctx.user.id,
        });

        // Notify assigned owner
        if (parsedInput.ownerId && parsedInput.ownerId !== ctx.user.id) {
            await createNotification({
                organizationId: ctx.orgId,
                userId: parsedInput.ownerId,
                type: "assignment",
                title: "Deal assigned to you",
                body: `"${deal.title}" has been assigned to you.`,
                metadata: JSON.stringify({ dealId: deal.id }),
            });
        }

        await sendEvent(dealCreatedEvent.create({
            dealId: deal.id,
            orgId: ctx.orgId,
            userId: ctx.user.id,
        }));

        await logAudit({
            orgId: ctx.orgId,
            userId: ctx.user.id,
            action: "deal.created",
            resourceType: "deal",
            resourceId: deal.id,
            after: deal,
        });

        return { deal };
    });

export const updateDealAction = memberActionClient
    .inputSchema(updateDealSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { id, ...data } = parsedInput;

        const deal = await updateDeal(id, ctx.orgId, data);
        if (!deal) throw new ActionError("Deal not found.");

        // Notify new owner on reassignment
        if (data.ownerId && data.ownerId !== ctx.user.id) {
            await createNotification({
                organizationId: ctx.orgId,
                userId: data.ownerId,
                type: "assignment",
                title: "Deal assigned to you",
                body: `"${deal.title}" has been assigned to you.`,
                metadata: JSON.stringify({ dealId: deal.id }),
            });
        }

        await logAudit({
            orgId: ctx.orgId,
            userId: ctx.user.id,
            action: "deal.updated",
            resourceType: "deal",
            resourceId: deal.id,
            after: data,
        });

        return { deal };
    });

export const changeDealStageAction = memberActionClient
    .inputSchema(changeDealStageSchema)
    .action(async ({ parsedInput, ctx }) => {
        const existingDeal = await getDealById(parsedInput.id, ctx.orgId);
        if (!existingDeal) throw new ActionError("Deal not found.");

        const newStage = await getStageById(parsedInput.stageId);
        if (!newStage) throw new ActionError("Stage not found.");

        const deal = await updateDealStage(parsedInput.id, ctx.orgId, parsedInput.stageId);
        if (!deal) throw new ActionError("Failed to update deal stage.");

        // Log stage change activity
        await createActivity({
            organizationId: ctx.orgId,
            type: "status_change",
            title: `Deal moved to "${newStage.name}"`,
            dealId: deal.id,
            userId: ctx.user.id,
        });

        // Notify deal owner of stage change (if someone else moved it)
        if (deal.ownerId && deal.ownerId !== ctx.user.id) {
            await createNotification({
                organizationId: ctx.orgId,
                userId: deal.ownerId,
                type: "deal_update",
                title: "Deal stage updated",
                body: `"${deal.title}" was moved to ${newStage.name}.`,
                metadata: JSON.stringify({ dealId: deal.id, stageId: parsedInput.stageId }),
            });
        }

        await sendEvent(dealStageChangedEvent.create({
            dealId: deal.id,
            fromStageId: existingDeal.stageId,
            toStageId: parsedInput.stageId,
            orgId: ctx.orgId,
            userId: ctx.user.id,
        }));

        await logAudit({
            orgId: ctx.orgId,
            userId: ctx.user.id,
            action: "deal.stage.changed",
            resourceType: "deal",
            resourceId: deal.id,
            before: { stageId: existingDeal.stageId },
            after: { stageId: parsedInput.stageId },
        });

        return { deal };
    });

export const deleteDealAction = managerActionClient
    .inputSchema(z.object({ id: z.string() }))
    .action(async ({ parsedInput, ctx }) => {
        const deal = await softDeleteDeal(parsedInput.id, ctx.orgId);
        if (!deal) throw new ActionError("Deal not found.");
        await logAudit({
            orgId: ctx.orgId,
            userId: ctx.user.id,
            action: "deal.deleted",
            resourceType: "deal",
            resourceId: deal.id,
            before: deal,
        });
        return { deal };
    });