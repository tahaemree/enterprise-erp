import { Skeleton } from "@/components/ui/skeleton"

export default function CustomersLoading() {
    return (
        <div className="space-y-6">
            {/* Header / Add Button Skeleton */}
            <div className="flex justify-end">
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Stats Cards Skeletons */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-xl border bg-card/40 p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-8 w-24" />
                            </div>
                            <Skeleton className="h-12 w-12 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Data Table Skeleton */}
            <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm space-y-4">
                <div className="flex justify-between">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="space-y-2 mt-4">
                    <Skeleton className="h-12 w-full" />
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
            </div>
        </div>
    )
}
