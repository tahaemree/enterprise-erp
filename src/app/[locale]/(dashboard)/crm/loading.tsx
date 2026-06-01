import { Skeleton } from "@/components/ui/skeleton"

export default function CrmLoading() {
    return (
        <div className="space-y-6 p-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2" style={{ animationDelay: "0ms" }}>
                    <Skeleton className="h-9 w-48 motion-safe:animate-pulse" />
                    <Skeleton className="h-5 w-64 motion-safe:animate-pulse" />
                </div>
                <Skeleton className="h-10 w-36 motion-safe:animate-pulse" style={{ animationDelay: "50ms" }} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 rounded-xl motion-safe:animate-pulse" style={{ animationDelay: `${i * 75}ms` }} />
                ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <Skeleton className="h-72 rounded-xl motion-safe:animate-pulse" style={{ animationDelay: "200ms" }} />
                <Skeleton className="h-72 rounded-xl motion-safe:animate-pulse" style={{ animationDelay: "250ms" }} />
            </div>
        </div>
    )
}
