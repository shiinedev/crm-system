/**
 * Fast, synchronous role helpers for per-request gating in tRPC procedures,
 * server actions, and client nav visibility.
 *
 * The canonical role definitions and Better Auth permission statements live in
 * `@/lib/permissions`. This file mirrors that same hierarchy as cheap boolean
 * checks so hot paths don't need an async `hasPermission` round-trip.
 * Keep the two consistent.
 */

import { ORG_ROLES, ROLE_LABELS, type OrgRole } from "./permissions"

export type { OrgRole }
export { ROLE_LABELS }

/** Ordered hierarchy — higher index = more permissions (mirrors permissions.ts) */
const ROLE_HIERARCHY = ORG_ROLES

function rankOf(role: OrgRole): number {
    return ROLE_HIERARCHY.indexOf(role)
}

/** True if `role` is at or above the given minimum */
export function hasRole(role: OrgRole, minimum: OrgRole): boolean {
    return rankOf(role) >= rankOf(minimum)
}

// ─── Named permission checks ─────────────────────────────────────────────────

/** Can see all org-level data (not just own) */
export function canViewAll(role: OrgRole) { return hasRole(role, "manager") }

/** Can create/edit records — every member except `viewer` (matches memberProcedure) */
export function canWrite(role: OrgRole) { return hasRole(role, "support_agent") }

/** Can delete records / manage workflows, pipelines, members */
export function canManage(role: OrgRole) { return hasRole(role, "manager") }

/** Can access billing, audit log, org settings, member management */
export function canAdmin(role: OrgRole) { return hasRole(role, "admin") }

/** Can see Analytics page */
export function canViewAnalytics(role: OrgRole) { return hasRole(role, "manager") }

/** Can access Automation page */
export function canViewAutomation(role: OrgRole) { return hasRole(role, "manager") }

/** Can access AI assistant */
export function canUseAI(role: OrgRole) { return hasRole(role, "sales_rep") }

// ─── Nav visibility ──────────────────────────────────────────────────────────

/** Which nav hrefs are visible for a given role. */
export function visibleNavItems(role: OrgRole): Set<string> {
    const items = new Set(["/dashboard", "/tasks"])

    // All members see contacts, companies, documents
    if (hasRole(role, "support_agent")) {
        items.add("/contacts")
        items.add("/companies")
        items.add("/documents")
    }

    // sales_rep+ sees deals and AI
    if (canUseAI(role)) {
        items.add("/deals")
        items.add("/ai")
    }

    // manager+ sees analytics and automation
    if (canManage(role)) {
        items.add("/analytics")
        items.add("/automation")
    }

    // everyone sees settings
    items.add("/settings")

    return items
}
