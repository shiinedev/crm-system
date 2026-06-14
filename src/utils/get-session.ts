import "server-only"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/server/auth/auth"

export type AppSession = Awaited<ReturnType<typeof getSession>>

/**
 * Single source of truth for reading the session in RSC pages and server actions.
 * Always call this instead of auth.api.getSession() directly.
 *
 * @param redirectIfUnauthenticated - if true (default), redirects to /login when no session
 */

export async function getSession(redirectIfUnauthenticated = true) {
    const headersList = await headers()
    const session = await auth.api.getSession({ headers: headersList })

    if (!session && redirectIfUnauthenticated) {
        redirect("/login")
    }

    return session
}

/**
 * Like getSession but also asserts an active org.
 * Redirects to /settings/organization when no active org is set.
 */
export async function getSessionWithOrg() {
    const session = await getSession()

    if (!session?.session?.activeOrganizationId) {
        redirect("/settings/organization")
    }

    return {
        user: session.user,
        session: session.session,
        orgId: session.session.activeOrganizationId,
    }
}