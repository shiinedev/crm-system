"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, Building2, Users, TrendingUp, FileText, Loader2 } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useTRPC } from "@/lib/trpc/client"
import { useCommandPalette } from "@/hooks/use-command-palette"
import { cn } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"

type ResultType = "company" | "contact" | "deal" | "document"

interface SearchResult {
    id: string
    label: string
    subtitle?: string
    href: string
    type: ResultType
}

const TYPE_ICON: Record<ResultType, React.ElementType> = {
    company: Building2,
    contact: Users,
    deal: TrendingUp,
    document: FileText,
}

const TYPE_LABEL: Record<ResultType, string> = {
    company: "Companies",
    contact: "Contacts",
    deal: "Deals",
    document: "Documents",
}

export function CommandPalette() {
    const { open, setOpen } = useCommandPalette()
    const [q, setQ] = useState("")
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)
    const [selectedIdx, setSelectedIdx] = useState(0)

    const trpc = useTRPC()

    const debouncedQ = useDebounce(q, 200)


    const { data, isFetching } = useQuery(trpc.search.global.queryOptions({ q: debouncedQ },
        { enabled: debouncedQ.length >= 1 }))

    const grouped: Array<{ type: ResultType; items: SearchResult[] }> = []
    if (data) {
        for (const [key, items] of Object.entries(data)) {
            if (items.length > 0) {
                grouped.push({ type: key as ResultType, items })
            }
        }
    }

    const flat: SearchResult[] = grouped.flatMap((g) => g.items)

    // Reset selection when the query changes — "adjust state during render"
    // pattern (react.dev) instead of a cascading setState-in-effect.
    const [lastQ, setLastQ] = useState(debouncedQ)
    if (lastQ !== debouncedQ) {
        setLastQ(debouncedQ)
        setSelectedIdx(0)
    }

    // Focus input when opening (external system sync — allowed in an effect)
    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 10)
    }, [open])

    function handleOpenChange(next: boolean) {
        setOpen(next)
        if (!next) setQ("")
    }

    function navigate(href: string) {
        router.push(href)
        setOpen(false)
        setQ("")
    }

    function onKeyDown(e: React.KeyboardEvent) {
        if (e.key === "ArrowDown") {
            e.preventDefault()
            setSelectedIdx((i) => Math.min(i + 1, flat.length - 1))
        } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setSelectedIdx((i) => Math.max(i - 1, 0))
        } else if (e.key === "Enter" && flat[selectedIdx]) {
            navigate(flat[selectedIdx].href)
        }
    }

    const showEmpty = debouncedQ.length >= 1 && !isFetching && flat.length === 0

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden">
                {/* Search input */}
                <div className="flex items-center gap-3 border-b px-4 py-3">
                    {isFetching
                        ? <Loader2 className="h-4 w-4 shrink-0 text-muted-foreground animate-spin" />
                        : <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                    }
                    <input
                        ref={inputRef}
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder="Search companies, contacts, deals…"
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                    <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-muted-foreground border rounded px-1.5 py-0.5">
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <div className="max-h-[400px] overflow-y-auto">
                    {q.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground gap-1">
                            <Search className="h-8 w-8 mb-2 opacity-20" />
                            Start typing to search
                        </div>
                    )}

                    {showEmpty && (
                        <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
                            No results for &ldquo;{q}&rdquo;
                        </div>
                    )}

                    {grouped.map(({ type, items }) => {
                        const Icon = TYPE_ICON[type]
                        return (
                            <div key={type}>
                                <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/40">
                                    <Icon className="h-3 w-3" />
                                    {TYPE_LABEL[type]}
                                </div>
                                {items.map((item) => {
                                    const globalIdx = flat.findIndex((r) => r.id === item.id && r.type === item.type)
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => navigate(item.href)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                                                selectedIdx === globalIdx
                                                    ? "bg-accent text-accent-foreground"
                                                    : "hover:bg-muted/60"
                                            )}
                                            onMouseEnter={() => setSelectedIdx(globalIdx)}
                                        >
                                            <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                            <span className="font-medium truncate">{item.label}</span>
                                            {item.subtitle && (
                                                <span className="text-xs text-muted-foreground truncate ml-auto shrink-0">
                                                    {item.subtitle}
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )
                    })}
                </div>

                {/* Footer hint */}
                {flat.length > 0 && (
                    <div className="border-t px-4 py-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span><kbd className="border rounded px-1">↑↓</kbd> Navigate</span>
                        <span><kbd className="border rounded px-1">↵</kbd> Open</span>
                        <span><kbd className="border rounded px-1">ESC</kbd> Close</span>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value)
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])
    return debounced
}