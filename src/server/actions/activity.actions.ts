"use server";

import { z } from "zod";
import { orgActionClient } from "./safe-action";
import { createActivity, deleteActivity } from "@/db/queries/activities.queries";
import { createNotification } from "@/db/queries/notifications.queries";
import { createActivitySchema } from "@/lib/validations/activity";

export const createActivityAction = orgActionClient
    .inputSchema(createActivitySchema)
    .action(async ({ parsedInput, ctx }) => {
        const { mentionedUserIds, ...activityData } = parsedInput;

        const activity = await createActivity({
            ...activityData,
            organizationId: ctx.orgId,
            userId: ctx.user.id,
        });

        // Notify mentioned users
        if (mentionedUserIds && mentionedUserIds.length > 0) {
            await Promise.all(
                mentionedUserIds
                    .filter((id) => id !== ctx.user.id)
                    .map((userId) =>
                        createNotification({
                            organizationId: ctx.orgId,
                            userId,
                            type: "mention",
                            title: "You were mentioned",
                            body: parsedInput.body
                                ? parsedInput.body.slice(0, 120)
                                : `You were mentioned in a ${parsedInput.type}.`,
                            metadata: JSON.stringify({
                                activityId: activity.id,
                                dealId: parsedInput.dealId,
                                companyId: parsedInput.companyId,
                                contactId: parsedInput.contactId,
                            }),
                        })
                    )
            );
        }

        return { activity };
    });

export const deleteActivityAction = orgActionClient
    .inputSchema(z.object({ id: z.string() }))
    .action(async ({ parsedInput, ctx }) => {
        await deleteActivity(parsedInput.id, ctx.orgId);
        return { success: true };
    });