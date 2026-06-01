"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn, formatCurrency } from "@/lib/utils"
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from "recharts"
import { CheckCircle2, XCircle } from "lucide-react"

import type { BalanceSheet, BalanceSheetLine } from "@/lib/services/reporting-engine"

const CHART_COLORS = {
    assets: [
        "hsl(221, 83%, 53%)",
        "hsl(190, 90%, 50%)",
        "hsl(160, 84%, 39%)",
        "hsl(271, 81%, 56%)",
        "hsl(330, 81%, 60%)",
    ],
    liabilities: [
        "hsl(25, 95%, 53%)",
        "hsl(15, 90%, 55%)",
        "hsl(0, 72%, 51%)",
        "hsl(38, 92%, 50%)",
    ],
    equity: [
        "hsl(142, 71%, 45%)",
        "hsl(122, 39%, 45%)",
        "hsl(160, 50%, 50%)",
    ],
}

interface Props {
    data: BalanceSheet
}

function SectionCard({
    title,
    lines,
    total,
    colorClass,
}: {
    title: string
    lines: BalanceSheetLine[]
    total: number
    colorClass: string
}) {
    return (
        <Card>
            <CardHeader className={cn("pb-3", colorClass)}>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription className="text-2xl font-bold text-foreground">
                    {formatCurrency(total)}
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="space-y-3">
                    {lines.map((line) => (
                        <div key={line.label}>
                            <div className="flex items-center justify-between py-1.5">
                                <span className="text-sm font-medium">{line.label}</span>
                                <span className="text-sm font-mono tabular-nums">
                                    {formatCurrency(line.amount)}
                                </span>
                            </div>
                            {line.children && line.children.length > 0 && (
                                <div className="ml-4 space-y-1 border-l-2 border-muted pl-3">
                                    {line.children.map((child) => (
                                        <div
                                            key={child.label}
                                            className="flex items-center justify-between py-1 text-sm text-muted-foreground"
                                        >
                                            <span>{child.label}</span>
                                            <span className="font-mono tabular-nums">
                                                {formatCurrency(child.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

export function BalanceSheetTable({ data }: Props) {
    const t = useTranslations("reports")

    return (
        <div className="space-y-6">
            {/* Balance Check */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{t("balanceCheck")}</CardTitle>
                            <CardDescription>
                                {t("asOf")} {new Date(data.asOfDate).toLocaleDateString()}
                            </CardDescription>
                        </div>
                        {data.balanceCheck.passed ? (
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="text-sm font-medium">{t("balanced")}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-red-600">
                                <XCircle className="h-5 w-5" />
                                <span className="text-sm font-medium">
                                    {t("imbalance")}: {formatCurrency(data.balanceCheck.difference)}
                                </span>
                            </div>
                        )}
                    </div>
                </CardHeader>
            </Card>

            {/* Composition Pie Charts */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("composition")}</CardTitle>
                    <CardDescription>{t("compositionDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Assets Pie */}
                        <div>
                            <h4 className="text-sm font-medium text-center text-blue-600 mb-2">{t("assets")}</h4>
                            <div className="h-[200px]">
                                {data.assets.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.assets.map((l) => ({
                                                    name: l.label,
                                                    value: Math.abs(l.amount),
                                                }))}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={75}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {data.assets.map((_, i) => (
                                                    <Cell key={i} fill={CHART_COLORS.assets[i % CHART_COLORS.assets.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload?.[0]) {
                                                        const total = data.assets.reduce((s, l) => s + Math.abs(l.amount), 0)
                                                        const pct = total > 0 ? ((payload[0].value as number) / total) * 100 : 0
                                                        return (
                                                            <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
                                                                <p className="font-medium">{payload[0].name}</p>
                                                                <p className="text-muted-foreground">{formatCurrency(payload[0].value as number)} ({pct.toFixed(1)}%)</p>
                                                            </div>
                                                        )
                                                    }
                                                    return null
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">—</div>
                                )}
                            </div>
                        </div>

                        {/* Liabilities Pie */}
                        <div>
                            <h4 className="text-sm font-medium text-center text-orange-600 mb-2">{t("liabilities")}</h4>
                            <div className="h-[200px]">
                                {data.liabilities.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.liabilities.map((l) => ({
                                                    name: l.label,
                                                    value: Math.abs(l.amount),
                                                }))}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={75}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {data.liabilities.map((_, i) => (
                                                    <Cell key={i} fill={CHART_COLORS.liabilities[i % CHART_COLORS.liabilities.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload?.[0]) {
                                                        const total = data.liabilities.reduce((s, l) => s + Math.abs(l.amount), 0)
                                                        const pct = total > 0 ? ((payload[0].value as number) / total) * 100 : 0
                                                        return (
                                                            <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
                                                                <p className="font-medium">{payload[0].name}</p>
                                                                <p className="text-muted-foreground">{formatCurrency(payload[0].value as number)} ({pct.toFixed(1)}%)</p>
                                                            </div>
                                                        )
                                                    }
                                                    return null
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">—</div>
                                )}
                            </div>
                        </div>

                        {/* Equity Pie */}
                        <div>
                            <h4 className="text-sm font-medium text-center text-green-600 mb-2">{t("equity")}</h4>
                            <div className="h-[200px]">
                                {data.equity.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.equity.map((l) => ({
                                                    name: l.label,
                                                    value: Math.abs(l.amount),
                                                }))}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={75}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {data.equity.map((_, i) => (
                                                    <Cell key={i} fill={CHART_COLORS.equity[i % CHART_COLORS.equity.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload?.[0]) {
                                                        const total = data.equity.reduce((s, l) => s + Math.abs(l.amount), 0)
                                                        const pct = total > 0 ? ((payload[0].value as number) / total) * 100 : 0
                                                        return (
                                                            <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
                                                                <p className="font-medium">{payload[0].name}</p>
                                                                <p className="text-muted-foreground">{formatCurrency(payload[0].value as number)} ({pct.toFixed(1)}%)</p>
                                                            </div>
                                                        )
                                                    }
                                                    return null
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">—</div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Three sections: Assets, Liabilities, Equity */}
            <div className="grid gap-6 lg:grid-cols-3">
                <SectionCard
                    title={t("assets")}
                    lines={data.assets}
                    total={data.totalAssets}
                    colorClass="bg-blue-500/5 border-blue-500/20"
                />
                <SectionCard
                    title={t("liabilities")}
                    lines={data.liabilities}
                    total={data.totalLiabilities}
                    colorClass="bg-orange-500/5 border-orange-500/20"
                />
                <SectionCard
                    title={t("equity")}
                    lines={data.equity}
                    total={data.totalEquity}
                    colorClass="bg-green-500/5 border-green-500/20"
                />
            </div>

            {/* Accounting Equation */}
            <Card className="bg-muted/30">
                <CardContent className="pt-6">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">{t("accountingEquation")}</p>
                        <div className="flex items-center justify-center gap-3 text-sm font-mono flex-wrap">
                            <span className="font-bold text-blue-600">
                                {t("assets")}: {formatCurrency(data.totalAssets)}
                            </span>
                            <span className="text-muted-foreground">=</span>
                            <span className="font-bold text-orange-600">
                                {t("liabilities")}: {formatCurrency(data.totalLiabilities)}
                            </span>
                            <span className="text-muted-foreground">+</span>
                            <span className="font-bold text-green-600">
                                {t("equity")}: {formatCurrency(data.totalEquity)}
                            </span>
                            <span className="text-muted-foreground">=</span>
                            <span className="font-bold">
                                {formatCurrency(data.totalLiabilities + data.totalEquity)}
                            </span>
                        </div>
                        {!data.balanceCheck.passed && (
                            <p className="text-xs text-red-500 mt-2">
                                {t("difference")}: {formatCurrency(data.balanceCheck.difference)}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
