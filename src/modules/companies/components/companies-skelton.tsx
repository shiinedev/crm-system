import { Skeleton } from "@/components/ui/skeleton"

export function CompaniesTableSkeleton() {
  return (
    <div className="flex-1 overflow-auto">
    <table className="w-full text-sm p-6 ">
      <thead>
        <tr className="border-b bg-muted/30">
          <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
            Company
          </th>
          <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
            Industry
          </th>
          <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
            Stage
          </th>
          <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
            Location
          </th>
          <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
            Size
          </th>
          <th className="w-10 px-4" />
        </tr>
      </thead>

      <tbody>
        {Array.from({ length: 6 }).map((_, index) => (
          <tr key={index} className="border-b">
            <td className="px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-7 w-7 rounded" />

                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </td>

            <td className="px-4 py-3">
              <Skeleton className="h-4 w-24" />
            </td>

            <td className="px-4 py-3">
              <Skeleton className="h-6 w-20 rounded-full" />
            </td>

            <td className="px-4 py-3">
              <Skeleton className="h-4 w-28" />
            </td>

            <td className="px-4 py-3">
              <Skeleton className="h-4 w-20" />
            </td>

            <td className="px-4 py-3">
              <Skeleton className="h-7 w-7 rounded-md" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  )
}