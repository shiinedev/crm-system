/** Centralised Redis key factory — keeps key strings consistent and refactor-safe */
export const cacheKeys = {
    /** Global search results for an org + query combo */
    search: (orgId: string, q: string) =>
        `search:${orgId}:${encodeURIComponent(q.toLowerCase().trim())}`,

    /** Dashboard KPI summary for an org */
    dashboardSummary: (orgId: string) => `dashboard:summary:${orgId}`,

    /** Deal stats for an org */
    dealStats: (orgId: string) => `deals:stats:${orgId}`,
} as const