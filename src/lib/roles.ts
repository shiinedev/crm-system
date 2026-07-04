/**
 * Role definitions for the CRM.
 * These mirror the memberRoles array in auth.ts — single source of truth.
 */

export type OrgRole =
    | "owner"
    | "admin"
    | "manager"
    | "sales_rep"
    | "support_agent"
    | "viewer"

/** Ordered hierarchy — higher index = more permissions */
const ROLE_HIERARCHY: OrgRole[] = [
    "viewer",
    "support_agent",
    "sales_rep",
    "manager",
    "admin",
    "owner",
]

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

/** Can create/edit deals, contacts, companies */
export function canWrite(role: OrgRole) { return hasRole(role, "sales_rep") }

/** Can manage workflows, pipelines, members */
export function canManage(role: OrgRole) { return hasRole(role, "manager") }

/** Can access billing, audit log, org settings */
export function canAdmin(role: OrgRole) { return hasRole(role, "admin") }

/** Can see Analytics page */
export function canViewAnalytics(role: OrgRole) { return hasRole(role, "manager") }

/** Can access Automation page */
export function canViewAutomation(role: OrgRole) { return hasRole(role, "manager") }

/** Can access AI assistant */
export function canUseAI(role: OrgRole) { return hasRole(role, "sales_rep") }

// ─── Nav visibility ──────────────────────────────────────────────────────────

/** Which nav items are visible for a given role */
export function visibleNavItems(role: OrgRole): Set<string> {
    const items = new Set(["/dashboard", "/tasks"])

    // All members see contacts, companies, documents
    if (hasRole(role, "support_agent")) {
        items.add("/contacts")
        items.add("/companies")
        items.add("/documents")
    }

    // sales_rep+ sees deals and AI
    if (canWrite(role)) {
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

// ─── Role display helpers ────────────────────────────────────────────────────

export const ROLE_LABELS: Record<OrgRole, string> = {
    owner: "Owner",
    admin: "Admin",
    manager: "Manager",
    sales_rep: "Sales Rep",
    support_agent: "Support Agent",
    viewer: "Viewer",
}