import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
    return (
        <div className="space-y-6 p-6 animate-in fade-in duration-500">
            <div className="space-y-2 mb-6" style={{ animationDelay: "0ms" }}>
                <Skeleton className="h-9 w-48 motion-safe:animate-pulse" />
                <Skeleton className="h-5 w-64 motion-safe:animate-pulse" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                    <Skeleton className="h-48 rounded-xl motion-safe:animate-pulse" style={{ animationDelay: "50ms" }} />
                    <Skeleton className="h-48 rounded-xl motion-safe:animate-pulse" style={{ animationDelay: "100ms" }} />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-64 rounded-xl motion-safe:animate-pulse" style={{ animationDelay: "75ms" }} />
                </div>
            </div>
        </div>
    )
}
