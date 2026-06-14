import "server-only";
import { headers } from "next/headers";
import { db } from "@/db";
import { auth } from "@/server/auth/auth";
import { members } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function createTRPCContext() {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    const orgId = session?.session?.activeOrganizationId ?? null;

    let orgMember = null;
    if (session?.user?.id && orgId) {
        const [member] = await db
            .select()
            .from(members)
            .where(
                and(
                    eq(members.userId, session.user.id),
                    eq(members.organizationId, orgId)
                )
            )
            .limit(1);
        orgMember = member ?? null;
    }

    return {
        db,
        session: session?.session ?? null,
        user: session?.user ?? null,
        orgId,
        orgMember,
        headers: headersList,
    };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;