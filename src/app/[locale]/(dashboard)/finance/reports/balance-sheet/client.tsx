"use client"

import { useEffect, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BalanceSheetTable } from "@/components/reports/balance-sheet-table"
import { getBalanceSheetData } from "@/lib/actions/reports"
import type { BalanceSheet } from "@/lib/services/reporting-engine"

export function BalanceSheetClient() {
    const t = useTranslations("reports")
    const [isPending, startTransition] = useTransition()
    const [data, setData] = useState<BalanceSheet | null>(null)
    const [asOfDate, setAsOfDate] = useState(() => new Date())

    const loadData = (date: Date) => {
        startTransition(async () => {
            const result = await getBalanceSheetData(date)
            setData(result as unknown as BalanceSheet)
        })
    }

    // Load initial data on mount
    useEffect(() => {
        loadData(asOfDate)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const refresh = () => {
        const now = new Date()
        setAsOfDate(now)
        loadData(now)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {t("asOf")} {asOfDate.toLocaleDateString()}
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={refresh}
                    disabled={isPending}
                    className="h-8 gap-1.5"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
                    {t("refresh")}
                </Button>
            </div>

            {isPending ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : data ? (
                <BalanceSheetTable data={data} />
            ) : (
                <div className="flex items-center justify-center py-20 text-muted-foreground">
                    {t("noData")}
                </div>
            )}
        </div>
    )
}
