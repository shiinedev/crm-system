"use client"

import { useTRPC } from "@/lib/trpc/client"
import {
    canViewAll, canWrite, canManage, canAdmin,
    canViewAnalytics, canViewAutomation, canUseAI,
    visibleNavItems,
    type OrgRole,
} from "@/lib/roles"
import { useQuery } from "@tanstack/react-query"

/**
 * Returns the current user's role and pre-computed permission flags.
 * Data comes from tRPC role.mine which reads ctx.role set by better-auth.
 */
export function useRole() {
    const trpc = useTRPC()
    const { data, isLoading } = useQuery(trpc.role.mine.queryOptions())
    const role = (data?.role ?? null) as OrgRole | null

    return {
        role,
        isLoading,
        // Permission flags — all false while loading
        canViewAll: role ? canViewAll(role) : false,
        canWrite: role ? canWrite(role) : false,
        canManage: role ? canManage(role) : false,
        canAdmin: role ? canAdmin(role) : false,
        canViewAnalytics: role ? canViewAnalytics(role) : false,
        canViewAutomation: role ? canViewAutomation(role) : false,
        canUseAI: role ? canUseAI(role) : false,
        visibleNavItems: role ? visibleNavItems(role) : new Set<string>(),
    }
}