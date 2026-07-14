import { Skeleton } from "@/components/ui/skeleton"

/** Kanban-shaped loading state: columns of card skeletons matching the boards. */
export function BoardSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex h-full gap-3 p-4 min-w-max">
      {[...Array(columns)].map((_, col) => (
        <div key={col} className="flex flex-col w-72 shrink-0 rounded-xl bg-muted/40 border">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-6 rounded-full ml-auto" />
          </div>
          <div className="flex flex-col gap-2 p-2">
            {[...Array(col === 0 ? 3 : 2)].map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-1.5">
                  <Skeleton className="h-4 w-12 rounded-full" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
