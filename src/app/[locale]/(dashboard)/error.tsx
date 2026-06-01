"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCcw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { createLogger } from "@/lib/logger"
import { useTranslations } from "next-intl"

const logger = createLogger("dashboard-error")

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const t = useTranslations("errors")

    useEffect(() => {
        logger.error("Dashboard caught an error", { error: { message: error.message, name: error.name }, digest: error.digest })
    }, [error])

    return (
        <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-6 page-enter">
            {/* Error illustration */}
            <div className="relative">
                <div className="rounded-full bg-destructive/10 p-5 animate-pulse">
                    <AlertTriangle className="h-12 w-12 text-destructive" />
                </div>
                <div className="absolute -top-1 -right-1 h-4 w-4">
                    <span className="flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/40" />
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-destructive/60" />
                    </span>
                </div>
            </div>

            <div className="text-center max-w-md">
                <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {error.message || t("description")}
                </p>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
                <Button onClick={() => reset()} variant="default" size="lg" className="gap-2">
                    <RefreshCcw className="h-4 w-4" />
                    {t("retry")}
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2">
                    <Link href="/dashboard">
                        <Home className="h-4 w-4" />
                        {t("backToHome")}
                    </Link>
                </Button>
            </div>

            {error.digest && (
                <p className="text-[10px] text-muted-foreground/50 font-mono">
                    Error ID: {error.digest}
                </p>
            )}
        </div>
    )
}
