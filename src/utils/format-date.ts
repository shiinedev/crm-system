// Intl formatters are expensive to construct — cache per options shape
const dateFormatters = new Map<string, Intl.DateTimeFormat>()

export function formatDate(
    date: Date | string | null | undefined,
    options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }
): string {
    if (!date) return "—"
    const key = JSON.stringify(options)
    let formatter = dateFormatters.get(key)
    if (!formatter) {
        formatter = new Intl.DateTimeFormat("en-US", options)
        dateFormatters.set(key, formatter)
    }
    return formatter.format(new Date(date))
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
    if (!date) return "—"
    const now = Date.now()
    const diff = now - new Date(date).getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return "just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return formatDate(date)
}