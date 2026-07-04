import {
    createSearchParamsCache,
    parseAsString,
    parseAsInteger,
    parseAsStringEnum,
    parseAsArrayOf,
} from "nuqs/server"

/**
 * Enum URL param where "" means "no filter".
 * Keeps the value fully typed (`"" | ...values`) without `as any` casts.
 */
function parseAsOptionalEnum<T extends string>(values: readonly T[]) {
    return parseAsStringEnum<T | "">([...values, ""]).withDefault("")
}

// ── Shared filter option lists (single source for params + <Select> UIs) ──

export const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"] as const
export const TASK_STATUS_OPTIONS = ["todo", "in_progress", "done", "cancelled"] as const

// ── Shared params used across multiple modules ─────────────

export const searchParams = {
    // Universal
    q: parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(25),
    sort: parseAsString.withDefault("createdAt"),
    order: parseAsStringEnum(["asc", "desc"]).withDefault("desc"),

    // Companies
    companyLifecycle: parseAsOptionalEnum([
        "lead", "prospect", "opportunity", "customer", "churned",
    ]),
    companyIndustry: parseAsString.withDefault(""),
    companySize: parseAsString.withDefault(""),

    // Contacts
    contactStatus: parseAsOptionalEnum(["active", "inactive", "bounced"]),
    contactCompanyId: parseAsString.withDefault(""),

    // Deals
    dealPipelineId: parseAsString.withDefault(""),
    dealStageId: parseAsString.withDefault(""),
    dealOwnerId: parseAsString.withDefault(""),
    dealPriority: parseAsOptionalEnum(PRIORITY_OPTIONS),
    dealForecast: parseAsOptionalEnum([
        "pipeline", "best_case", "commit", "closed_won", "closed_lost", "omitted",
    ]),

    // Tasks
    taskStatus: parseAsOptionalEnum(TASK_STATUS_OPTIONS),
    taskAssigneeId: parseAsString.withDefault(""),
    taskPriority: parseAsOptionalEnum(PRIORITY_OPTIONS),

    // Activities
    activityType: parseAsOptionalEnum([
        "call", "meeting", "email", "note", "task", "status_change", "document_upload", "comment",
    ]),

    // Notifications
    notificationRead: parseAsOptionalEnum(["read", "unread"]),

    // Tags (multi-select)
    tags: parseAsArrayOf(parseAsString).withDefault([]),
}

// ── Server-side cache (for RSC pages) ─────────────────────
export const searchParamsCache = createSearchParamsCache(searchParams)
