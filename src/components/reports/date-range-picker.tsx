"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { CalendarIcon, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { formatDate } from "@/lib/utils"
import type { AppTranslator } from "@/lib/i18n-types"


interface DateRangePickerProps {
    startDate: Date
    endDate: Date
    onRangeChange: (start: Date, end: Date) => void
    showComparison?: boolean
    compareWithPrevious?: boolean
    onComparisonChange?: (value: boolean) => void
}

const getPresets = (t: AppTranslator) => [
    { label: t.has?.("dateRange.thisMonth") ? t("dateRange.thisMonth") : "This Month", getRange: () => getMonthRange(0) },
    { label: t.has?.("dateRange.lastMonth") ? t("dateRange.lastMonth") : "Last Month", getRange: () => getMonthRange(-1) },
    { label: t.has?.("dateRange.thisQuarter") ? t("dateRange.thisQuarter") : "This Quarter", getRange: () => getQuarterRange(0) },
    { label: t.has?.("dateRange.lastQuarter") ? t("dateRange.lastQuarter") : "Last Quarter", getRange: () => getQuarterRange(-1) },
    { label: t.has?.("dateRange.thisYear") ? t("dateRange.thisYear") : "This Year", getRange: () => getYearRange(0) },
    { label: t.has?.("dateRange.lastYear") ? t("dateRange.lastYear") : "Last Year", getRange: () => getYearRange(-1) },
    { label: t.has?.("dateRange.last30Days") ? t("dateRange.last30Days") : "Last 30 Days", getRange: () => getDaysRange(30) },
    { label: t.has?.("dateRange.last90Days") ? t("dateRange.last90Days") : "Last 90 Days", getRange: () => getDaysRange(90) },
]

function getMonthRange(offset: number) {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0)
    return { start, end }
}

function getQuarterRange(offset: number) {
    const now = new Date()
    const quarter = Math.floor((now.getMonth() + offset * 3) / 3)
    const year = now.getFullYear() + Math.floor((now.getMonth() + offset * 3) / 12)
    const adjustedQuarter = ((quarter % 4) + 4) % 4
    const start = new Date(year, adjustedQuarter * 3, 1)
    const end = new Date(year, adjustedQuarter * 3 + 3, 0)
    return { start, end }
}

function getYearRange(offset: number) {
    const year = new Date().getFullYear() + offset
    return {
        start: new Date(year, 0, 1),
        end: new Date(year, 11, 31),
    }
}

function getDaysRange(days: number) {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    return { start, end }
}

export function DateRangePicker({
    startDate,
    endDate,
    onRangeChange,
    showComparison,
    compareWithPrevious,
    onComparisonChange,
}: DateRangePickerProps) {
    const t = useTranslations("reports")
    const [startOpen, setStartOpen] = useState(false)
    const [endOpen, setEndOpen] = useState(false)

    const tGlobal = useTranslations()
    const presets = getPresets(tGlobal)

    const applyPreset = (preset: typeof presets[number]) => {
        const { start, end } = preset.getRange()
        onRangeChange(start, end)
    }

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Presets */}
                    <div className="flex flex-wrap gap-1.5">
                        {presets.map((preset) => (
                            <Button
                                key={preset.label}
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => applyPreset(preset)}
                            >
                                {preset.label}
                            </Button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        {/* Start Date */}
                        <Popover open={startOpen} onOpenChange={setStartOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1.5 text-xs"
                                >
                                    <CalendarIcon className="h-3.5 w-3.5" />
                                    {formatDate(startDate)}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={(date) => {
                                        if (date) {
                                            onRangeChange(date, endDate)
                                            setStartOpen(false)
                                        }
                                    }}
                                    autoFocus
                                />
                            </PopoverContent>
                        </Popover>

                        <span className="text-xs text-muted-foreground">—</span>

                        {/* End Date */}
                        <Popover open={endOpen} onOpenChange={setEndOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1.5 text-xs"
                                >
                                    <CalendarIcon className="h-3.5 w-3.5" />
                                    {formatDate(endDate)}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={endDate}
                                    onSelect={(date) => {
                                        if (date) {
                                            onRangeChange(startDate, date)
                                            setEndOpen(false)
                                        }
                                    }}
                                    autoFocus
                                />
                            </PopoverContent>
                        </Popover>

                        {/* Period Comparison Toggle */}
                        {showComparison && onComparisonChange && (
                            <Button
                                variant={compareWithPrevious ? "default" : "outline"}
                                size="sm"
                                className="h-8 text-xs gap-1.5"
                                onClick={() => onComparisonChange(!compareWithPrevious)}
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                {t("compareWithPrevious")}
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
