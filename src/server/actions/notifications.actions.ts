"use server"

import { z } from "zod"
import { orgActionClient } from "./safe-action"
import {
    markNotificationRead,
    markAllNotificationsRead,
} from "@/db/queries/notifications.queries"

export const markNotificationReadAction = orgActionClient
    .inputSchema(z.object({ id: z.string() }))
    .action(async ({ parsedInput, ctx }) => {
        const notification = await markNotificationRead(parsedInput.id, ctx.user.id)
        return { notification }
    })

export const markAllNotificationsReadAction = orgActionClient
    .inputSchema(z.object({}))
    .action(async ({ ctx }) => {
        await markAllNotificationsRead(ctx.user.id, ctx.orgId)
        return { success: true }
    })