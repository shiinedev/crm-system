import "server-only";
import { createSafeActionClient } from "next-safe-action";
import { headers } from "next/headers";
import { auth } from "@/server/auth/auth";
import { db } from "@/db";
import { members } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export class ActionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ActionError";
    }
}

// ── Base client 
export const actionClient = createSafeActionClient({
    handleServerError(error) {
        if (error instanceof ActionError) return error.message;
        return "An unexpected error occurred.";
    },
});

// ── Authenticated client 
export const authActionClient = actionClient.use(async ({ next }) => {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user || !session?.session) {
        throw new ActionError("You must be signed in to perform this action.");
    }

    return next({ ctx: { user: session.user, session: session.session } });
});

// ── Org-scoped authenticated client 
export const orgActionClient = authActionClient.use(async ({ next, ctx }) => {
    const orgId = ctx.session.activeOrganizationId;

    if (!orgId) {
        throw new ActionError("No active organization. Please select an organization.");
    }

    const [member] = await db
        .select()
        .from(members)
        .where(and(eq(members.userId, ctx.user.id), eq(members.organizationId, orgId)))
        .limit(1);

    if (!member) {
        throw new ActionError("You are not a member of this organization.");
    }

    return next({ ctx: { ...ctx, orgId, member } });
});

// ── Manager-level client 
export const managerActionClient = orgActionClient.use(async ({ next, ctx }) => {
    const allowedRoles = ["owner", "admin", "manager"];
    if (!allowedRoles.includes(ctx.member.role)) {
        throw new ActionError("You need manager permissions to perform this action.");
    }
    return next({ ctx });
});

// ── Admin-level client 
export const adminActionClient = orgActionClient.use(async ({ next, ctx }) => {
    const allowedRoles = ["owner", "admin"];
    if (!allowedRoles.includes(ctx.member.role)) {
        throw new ActionError("You need admin permissions to perform this action.");
    }
    return next({ ctx });
});