export function formatCompactNumber(value: number | string | null | undefined): string {
    const num = Number(value ?? 0)
    return new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(num)
}