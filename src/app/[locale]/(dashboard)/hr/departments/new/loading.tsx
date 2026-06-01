import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="w-full space-y-6 p-6 animate-pulse">
            <div className="space-y-2">
                <Skeleton className="h-8 w-[250px]" />
                <Skeleton className="h-4 w-[350px]" />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-[400px] w-full rounded-xl" />
                <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
        </div>
    )
}
