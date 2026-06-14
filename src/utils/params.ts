import {
    createSearchParamsCache,
    parseAsString,
    parseAsInteger,
    parseAsStringEnum,
    parseAsArrayOf,
} from "nuqs/server"

// ── Shared params used across multiple modules ─────────────

export const searchParams = {
    // Universal
    q: parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(25),
    sort: parseAsString.withDefault("createdAt"),
    order: parseAsStringEnum(["asc", "desc"]).withDefault("desc"),

    // Companies
    companyLifecycle: parseAsStringEnum([
        "lead", "prospect", "opportunity", "customer", "churned",
    ]).withDefault("" as any),
    companyIndustry: parseAsString.withDefault(""),
    companySize: parseAsString.withDefault(""),

    // Contacts
    contactStatus: parseAsStringEnum([
        "active", "inactive", "bounced",
    ]).withDefault("" as any),
    contactCompanyId: parseAsString.withDefault(""),

    // Deals
    dealPipelineId: parseAsString.withDefault(""),
    dealStageId: parseAsString.withDefault(""),
    dealOwnerId: parseAsString.withDefault(""),
    dealPriority: parseAsStringEnum([
        "low", "medium", "high", "urgent",
    ]).withDefault("" as any),
    dealForecast: parseAsStringEnum([
        "pipeline", "best_case", "commit", "closed_won", "closed_lost", "omitted",
    ]).withDefault("" as any),

    // Tasks
    taskStatus: parseAsStringEnum([
        "todo", "in_progress", "done", "cancelled",
    ]).withDefault("" as any),
    taskAssigneeId: parseAsString.withDefault(""),
    taskPriority: parseAsStringEnum([
        "low", "medium", "high", "urgent",
    ]).withDefault("" as any),

    // Activities
    activityType: parseAsStringEnum([
        "call", "meeting", "email", "note", "task", "status_change", "document_upload", "comment",
    ]).withDefault("" as any),

    // Notifications
    notificationRead: parseAsStringEnum(["read", "unread"]).withDefault("" as any),

    // Tags (multi-select)
    tags: parseAsArrayOf(parseAsString).withDefault([]),
}

// ── Server-side cache (for RSC pages) ─────────────────────
export const searchParamsCache = createSearchParamsCache({
    q: searchParams.q,
    page: searchParams.page,
    perPage: searchParams.perPage,
    sort: searchParams.sort,
    order: searchParams.order,
    companyLifecycle: searchParams.companyLifecycle,
    companyIndustry: searchParams.companyIndustry,
    companySize: searchParams.companySize,
    contactStatus: searchParams.contactStatus,
    contactCompanyId: searchParams.contactCompanyId,
    dealPipelineId: searchParams.dealPipelineId,
    dealStageId: searchParams.dealStageId,
    dealOwnerId: searchParams.dealOwnerId,
    dealPriority: searchParams.dealPriority,
    dealForecast: searchParams.dealForecast,
    taskStatus: searchParams.taskStatus,
    taskAssigneeId: searchParams.taskAssigneeId,
    taskPriority: searchParams.taskPriority,
    activityType: searchParams.activityType,
    notificationRead: searchParams.notificationRead,
    tags: searchParams.tags,
})