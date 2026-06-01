"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCcw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { createLogger } from "@/lib/logger"

const logger = createLogger("inventory-error")

export default function InventoryError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        logger.error("Inventory module caught an error", { error: { message: error.message, name: error.name }, digest: error.digest })
    }, [error])

    return (
        <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-6">
            <div className="rounded-full bg-destructive/10 p-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div className="text-center max-w-md">
                <h1 className="text-2xl font-bold tracking-tight">Inventory Error</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    {error.message || "An unexpected error occurred in the inventory module."}
                </p>
            </div>
            <div className="flex gap-3">
                <Button onClick={() => reset()} variant="default" className="gap-2">
                    <RefreshCcw className="h-4 w-4" />
                    Try Again
                </Button>
                <Button asChild variant="outline" className="gap-2">
                    <Link href="/dashboard">
                        <Home className="h-4 w-4" />
                        Dashboard
                    </Link>
                </Button>
            </div>
        </div>
    )
}
