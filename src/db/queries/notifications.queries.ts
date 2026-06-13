import "server-only";
import { eq, and, isNull, desc } from "drizzle-orm";
import { db } from "@/db";
import { notifications, type NewNotification } from "@/db/schema";

export async function getNotificationsByUser(
    userId: string,
    organizationId: string,
    limit = 30
) {
    return db
        .select()
        .from(notifications)
        .where(
            and(
                eq(notifications.userId, userId),
                eq(notifications.organizationId, organizationId)
            )
        )
        .orderBy(desc(notifications.createdAt))
        .limit(limit);
}

export async function getUnreadNotifications(
    userId: string,
    organizationId: string
) {
    return db
        .select()
        .from(notifications)
        .where(
            and(
                eq(notifications.userId, userId),
                eq(notifications.organizationId, organizationId),
                isNull(notifications.readAt)
            )
        )
        .orderBy(desc(notifications.createdAt));
}

export async function createNotification(data: NewNotification) {
    const [notification] = await db
        .insert(notifications)
        .values(data)
        .returning();
    return notification;
}

export async function markNotificationRead(id: string, userId: string) {
    const [notification] = await db
        .update(notifications)
        .set({ readAt: new Date() })
        .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
        .returning();
    return notification ?? null;
}

export async function markAllNotificationsRead(
    userId: string,
    organizationId: string
) {
    await db
        .update(notifications)
        .set({ readAt: new Date() })
        .where(
            and(
                eq(notifications.userId, userId),
                eq(notifications.organizationId, organizationId),
                isNull(notifications.readAt)
            )
        );
}