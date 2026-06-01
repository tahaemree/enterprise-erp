"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createLogger } from "@/lib/logger"
import { useTranslations } from "next-intl"

const logger = createLogger("finance-error")

export default function FinanceError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const t = useTranslations("errors")

    useEffect(() => {
        logger.error("Finance module error:", { error: { message: error.message, name: error.name }, digest: error.digest })
    }, [error])

    return (
        <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
            <div className="rounded-full bg-destructive/10 p-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div className="text-center max-w-md">
                <h2 className="text-xl font-bold tracking-tight">{t("title")}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    {error.message || t("description")}
                </p>
            </div>
            <Button onClick={() => reset()} variant="default" size="sm" className="gap-2">
                <RefreshCcw className="h-4 w-4" />
                {t("retry")}
            </Button>
        </div>
    )
}
