/**
 * Single source of truth for organization roles & permissions.
 *
 * The `statement` below feeds Better Auth's permission engine (`ac` + `roles`),
 * which powers:
 *   - `hasPermission` / `checkRolePermission` (server + client),
 *   - the built-in member / invitation / organization endpoints (invite,
 *     updateMemberRole, removeMember, cancelInvitation, …) so they respect all
 *     six custom roles instead of only the default owner/admin/member.
 *
 * The fast synchronous helpers in `@/lib/roles` mirror this same hierarchy for
 * per-request gating in tRPC procedures and server actions (no extra awaits).
 * Keep the two in sync — this file is the canonical definition of the roles.
 */

import { createAccessControl } from "better-auth/plugins/access";
import {
    adminAc,
    memberAc,
    ownerAc,
    defaultStatements,
} from "better-auth/plugins/organization/access";

// ─── Statement (resources → actions) ─────────────────────────────────────────
// `defaultStatements` contributes the org-management resources Better Auth's
// built-in endpoints check: organization, member, invitation, team, ac.
export const statement = {
    ...defaultStatements,
    company: ["read", "create", "update", "delete"],
    contact: ["read", "create", "update", "delete"],
    deal: ["read", "create", "update", "delete"],
    task: ["read", "create", "update", "delete"],
    document: ["read", "create", "update", "delete"],
    pipeline: ["read", "create", "update", "delete"],
    automation: ["read", "run"],
    analytics: ["read"],
    ai: ["use"],
} as const;

export const ac = createAccessControl(statement);

// ─── Reusable domain permission tiers ────────────────────────────────────────
const READ_DOMAIN = {
    company: ["read"],
    contact: ["read"],
    deal: ["read"],
    task: ["read"],
    document: ["read"],
    pipeline: ["read"],
    automation: ["read"],
} as const;

const WRITE_DOMAIN = {
    company: ["read", "create", "update"],
    contact: ["read", "create", "update"],
    deal: ["read", "create", "update"],
    task: ["read", "create", "update"],
    document: ["read", "create", "update"],
    pipeline: ["read", "create", "update"],
    automation: ["read"],
} as const;

const MANAGE_DOMAIN = {
    company: ["read", "create", "update", "delete"],
    contact: ["read", "create", "update", "delete"],
    deal: ["read", "create", "update", "delete"],
    task: ["read", "create", "update", "delete"],
    document: ["read", "create", "update", "delete"],
    pipeline: ["read", "create", "update", "delete"],
    automation: ["read", "run"],
    analytics: ["read"],
} as const;

// ─── Roles ───────────────────────────────────────────────────────────────────
// Lowest → highest. `memberAc.statements` gives the baseline org-member grants
// (ac:read); `adminAc`/`ownerAc` add member/invitation/org management.

/** Read-only across the CRM. Cannot create, edit, or delete anything. */
export const viewer = ac.newRole({
    ...memberAc.statements,
    ...READ_DOMAIN,
});

/** Support: read + create/edit core records. No analytics, no AI. */
export const support_agent = ac.newRole({
    ...memberAc.statements,
    ...WRITE_DOMAIN,
});

/** Sales: read + create/edit records + AI assistant. No delete, no analytics. */
export const sales_rep = ac.newRole({
    ...memberAc.statements,
    ...WRITE_DOMAIN,
    ai: ["use"],
});

/** Manager: full CRUD + delete + analytics + run automations. */
export const manager = ac.newRole({
    ...memberAc.statements,
    ...MANAGE_DOMAIN,
    ai: ["use"],
});

/** Admin: manager + org settings, member & invitation management, custom roles. */
export const admin = ac.newRole({
    ...adminAc.statements,
    ...MANAGE_DOMAIN,
    ai: ["use"],
});

/** Owner: full access, including deleting the organization. */
export const owner = ac.newRole({
    ...ownerAc.statements,
    ...MANAGE_DOMAIN,
    ai: ["use"],
});

/** Roles map passed to the organization plugin (server) and client. */
export const roles = { owner, admin, manager, sales_rep, support_agent, viewer };

// ─── Role identity ───────────────────────────────────────────────────────────
/** Ordered lowest → highest privilege. Drives the hierarchy in `@/lib/roles`. */
export const ORG_ROLES = [
    "viewer",
    "support_agent",
    "sales_rep",
    "manager",
    "admin",
    "owner",
] as const;

export type OrgRole = (typeof ORG_ROLES)[number];

/** Roles assignable via the invite/role-change UI (everyone except owner). */
export const ASSIGNABLE_ROLES = [
    "admin",
    "manager",
    "sales_rep",
    "support_agent",
    "viewer",
] as const satisfies readonly OrgRole[];

export const ROLE_LABELS: Record<OrgRole, string> = {
    owner: "Owner",
    admin: "Admin",
    manager: "Manager",
    sales_rep: "Sales Rep",
    support_agent: "Support Agent",
    viewer: "Viewer",
};
