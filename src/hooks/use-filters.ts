"use client"

import { useQueryStates } from "nuqs"
import { searchParams } from "@/utils/params"

const filterConfig = {
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
}

type FilterState = Awaited<ReturnType<typeof useQueryStates<typeof filterConfig>>>[0]
type FilterSetters = Awaited<ReturnType<typeof useQueryStates<typeof filterConfig>>>[1]
type FilterKey = keyof FilterState
type FilterValue = FilterState[FilterKey]

/**
 * Single hook for all URL-based filter/search state.
 * Uses nuqs to keep everything in the URL — shareable, bookmarkable, browser-back friendly.
 */
export function useFilters() {
    const [state, setters] = useQueryStates(filterConfig, { shallow: false })

    function resetFilters() {
        void setters({
            q: "",
            page: 1,
            companyLifecycle: null,
            companyIndustry: "",
            companySize: "",
            contactStatus: null,
            contactCompanyId: "",
            dealPipelineId: "",
            dealStageId: "",
            dealOwnerId: "",
            dealPriority: null,
            dealForecast: null,
            taskStatus: null,
            taskAssigneeId: "",
            taskPriority: null,
            activityType: null,
            notificationRead: null,
            tags: [],
        })
    }

    // Reset page to 1 on any filter change
    function setFilter(key: FilterKey, value: FilterValue) {
        void (setters as FilterSetters)({ [key]: value, page: 1 } as Partial<FilterState>)
    }

    const hasActiveFilters =
        !!state.q ||
        !!state.companyLifecycle ||
        !!state.companyIndustry ||
        !!state.companySize ||
        !!state.contactStatus ||
        !!state.contactCompanyId ||
        !!state.dealPipelineId ||
        !!state.dealStageId ||
        !!state.dealOwnerId ||
        !!state.dealPriority ||
        !!state.dealForecast ||
        !!state.taskStatus ||
        !!state.taskAssigneeId ||
        !!state.taskPriority ||
        !!state.activityType ||
        !!state.notificationRead ||
        state.tags.length > 0

    return {
        ...state,
        setFilter,
        setFilters: setters,
        resetFilters,
        hasActiveFilters,
    }
}