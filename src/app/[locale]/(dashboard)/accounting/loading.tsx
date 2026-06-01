import { Skeleton } from "@/components/ui/skeleton"

export default function AccountingLoading() {
    return (
        <div className="space-y-6 p-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2" style={{ animationDelay: "0ms" }}>
                    <Skeleton className="h-9 w-56 motion-safe:animate-pulse" />
                    <Skeleton className="h-5 w-80 motion-safe:animate-pulse" />
                </div>
                <Skeleton className="h-10 w-40 motion-safe:animate-pulse" style={{ animationDelay: "50ms" }} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-xl motion-safe:animate-pulse" style={{ animationDelay: `${i * 75}ms` }} />
                ))}
            </div>
            <Skeleton className="h-96 rounded-xl motion-safe:animate-pulse" style={{ animationDelay: "150ms" }} />
        </div>
    )
}
