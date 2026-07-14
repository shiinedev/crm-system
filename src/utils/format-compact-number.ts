// Hoisted — constructing Intl.NumberFormat on every call is slow
const compactFormatter = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
})

export function formatCompactNumber(value: number | string | null | undefined): string {
    return compactFormatter.format(Number(value ?? 0))
}
