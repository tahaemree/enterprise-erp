"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Loader2, Table2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { PivotTable, getPivotPresets, type PivotPresetKey } from "@/components/reports/pivot-table"
import { getPivotAnalysisData } from "@/lib/actions/reports"
import type { PivotResult, PivotConfig } from "@/lib/services/reporting-engine"

export default function PivotPage() {
    const t = useTranslations("reports")
    const [isPending, startTransition] = useTransition()
    const [data, setData] = useState<PivotResult | null>(null)
    const [activePreset, setActivePreset] = useState<PivotPresetKey | "">("")
    const [error, setError] = useState<string | null>(null)

    const runPreset = (key: PivotPresetKey) => {
        setActivePreset(key)
        setError(null)
        startTransition(async () => {
            try {
                const preset = getPivotPresets(t)[key]
                const result = await getPivotAnalysisData(preset.config as unknown as PivotConfig)
                setData(result as unknown as PivotResult)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load pivot data")
                setData(null)
            }
        })
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Table2 className="h-7 w-7 text-primary" />
                    {t("pivotAnalysis")}
                </h1>
                <p className="text-muted-foreground mt-1">
                    {t("pivotDescription")}
                </p>
            </div>

            {/* Preset Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {(Object.entries(getPivotPresets(t)) as [PivotPresetKey, ReturnType<typeof getPivotPresets>[PivotPresetKey]][]).map(
                    ([key, preset]) => {
                        const Icon = preset.icon
                        return (
                            <button
                                key={key}
                                onClick={() => runPreset(key)}
                                className={cn(
                                    "rounded-lg border p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5",
                                    activePreset === key
                                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                                        : "bg-card",
                                )}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div
                                        className={cn(
                                            "rounded-lg p-2",
                                            activePreset === key
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted",
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </div>
                                </div>
                                <p className="text-sm font-medium">{preset.name}</p>
                            </button>
                        )
                    },
                )}
            </div>

            {/* Results */}
            {isPending ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : error ? (
                <Card>
                    <CardContent className="py-10 text-center">
                        <p className="text-red-500">{error}</p>
                    </CardContent>
                </Card>
            ) : data ? (
                <PivotTable
                    data={data}
                    title={
                        activePreset
                            ? getPivotPresets(t)[activePreset]?.name
                            : undefined
                    }
                />
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>{t("pivotAnalysis")}</CardTitle>
                        <CardDescription>
                            {t("pivotSelectPreset")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center py-10 text-muted-foreground">
                            <Table2 className="h-12 w-12 opacity-20" />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
