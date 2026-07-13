// Intl formatters are expensive to construct — cache per currency/notation
const formatters = new Map<string, Intl.NumberFormat>()

function getFormatter(currency: string, compact: boolean): Intl.NumberFormat {
    const key = `${currency}:${compact}`
    let formatter = formatters.get(key)
    if (!formatter) {
        formatter = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
            notation: compact ? "compact" : "standard",
            maximumFractionDigits: compact ? 1 : 2,
        })
        formatters.set(key, formatter)
    }
    return formatter
}

export function formatCurrency(
    value: number | string | null | undefined,
    currency = "USD",
    compact = false
): string {
    return getFormatter(currency, compact).format(Number(value ?? 0))
}
