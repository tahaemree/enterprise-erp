"use client"

import { useEffect, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
import { DateRangePicker } from "@/components/reports/date-range-picker"
import { IncomeStatementTable } from "@/components/reports/income-statement-table"
import { getIncomeStatementData } from "@/lib/actions/reports"
import type { IncomeStatement } from "@/lib/services/reporting-engine"

export function IncomeStatementClient() {
    const t = useTranslations("reports")
    const [isPending, startTransition] = useTransition()
    const [data, setData] = useState<IncomeStatement | null>(null)
    const [startDate, setStartDate] = useState(() => {
        const d = new Date()
        return new Date(d.getFullYear(), d.getMonth(), 1)
    })
    const [endDate, setEndDate] = useState(() => new Date())
    const [comparePrevious, setComparePrevious] = useState(false)

    const loadData = (start: Date, end: Date, compare?: boolean) => {
        startTransition(async () => {
            const result = await getIncomeStatementData(
                start,
                end,
                compare ?? comparePrevious,
            )
            setData(result as unknown as IncomeStatement)
        })
    }

    // Load initial data on mount
    useEffect(() => {
        loadData(startDate, endDate, comparePrevious)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleRangeChange = (start: Date, end: Date) => {
        setStartDate(start)
        setEndDate(end)
        loadData(start, end, comparePrevious)
    }

    const handleComparisonChange = (value: boolean) => {
        setComparePrevious(value)
        loadData(startDate, endDate, value)
    }

    return (
        <div className="space-y-4">
            <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onRangeChange={handleRangeChange}
                showComparison
                compareWithPrevious={comparePrevious}
                onComparisonChange={handleComparisonChange}
            />

            {isPending ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : data ? (
                <IncomeStatementTable data={data} />
            ) : (
                <div className="flex items-center justify-center py-20 text-muted-foreground">
                    {t("noData")}
                </div>
            )}
        </div>
    )
}
