import { z } from "zod"
import { createTRPCRouter, orgProcedure } from "../trpc"
import {
    getNotificationsByUser,
    getUnreadNotifications,
} from "@/db/queries/notifications.queries"

export const notificationsRouter = createTRPCRouter({
    list: orgProcedure
        .input(z.object({ limit: z.number().min(1).max(50).default(30) }))
        .query(({ ctx, input }) => {
            return getNotificationsByUser(ctx.user.id, ctx.orgId, input.limit)
        }),

    unread: orgProcedure.query(({ ctx }) => {
        return getUnreadNotifications(ctx.user.id, ctx.orgId)
    }),
})