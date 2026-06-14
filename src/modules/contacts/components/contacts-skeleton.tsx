import { Skeleton } from "@/components/ui/skeleton"

export function ContactsTableSkeleton() {
    return (
        <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b bg-muted/30">
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                            Name
                        </th>
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                            Contact
                        </th>
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                            Title
                        </th>
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                            Status
                        </th>
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                            Last seen
                        </th>
                        <th className="w-10 px-4" />
                    </tr>
                </thead>

                <tbody>
                    {Array.from({ length: 8 }).map((_, index) => (
                        <tr key={index} className="border-b">
                            {/* Name */}
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                    <Skeleton className="h-7 w-7 rounded-full" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                            </td>

                            {/* Contact */}
                            <td className="px-4 py-3">
                                <div className="space-y-1.5">
                                    <Skeleton className="h-3 w-40" />
                                    <Skeleton className="h-3 w-28" />
                                </div>
                            </td>

                            {/* Title */}
                            <td className="px-4 py-3">
                                <div className="space-y-1.5">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3">
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </td>

                            {/* Last Seen */}
                            <td className="px-4 py-3">
                                <Skeleton className="h-3 w-16" />
                            </td>

                            {/* Actions */}
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