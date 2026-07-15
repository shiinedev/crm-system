import "server-only";
import { headers } from "next/headers";
import { db } from "@/db";
import { auth } from "@/server/auth/auth";


export async function createTRPCContext() {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    const orgId = session?.session?.activeOrganizationId ?? null;

    let orgMember = null;
    if (session?.user?.id && orgId) {
        // Must pass headers — getActiveMember is session-scoped. Without them it
        // returns null, which left ctx.role null (blanked the role-based sidebar).
        const member = await auth.api.getActiveMember({ headers: headersList });
        orgMember = member ?? null;
    }

    return {
        db,
        session: session?.session ?? null,
        user: session?.user ?? null,
        orgId,
        role: orgMember?.role ?? null,
        orgMember,
        headers: headersList,
    };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;