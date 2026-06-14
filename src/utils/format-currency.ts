export function formatCurrency(
    value: number | string | null | undefined,
    currency = "USD",
    compact = false
): string {
    const num = Number(value ?? 0)
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        notation: compact ? "compact" : "standard",
        maximumFractionDigits: compact ? 1 : 2,
    }).format(num)
}