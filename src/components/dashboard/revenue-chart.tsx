"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend,
} from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"

interface RevenueChartProps {
    data?: { month: string; revenue: number; expenses?: number }[]
}

export function RevenueChart({ data }: RevenueChartProps) {
    const t = useTranslations("dashboard")
    const [chartType, setChartType] = useState<"area" | "bar">("area")
    const chartData = data || []

    const totalRevenue = chartData.reduce((s, d) => s + d.revenue, 0)
    const totalExpenses = chartData.reduce((s, d) => s + (d.expenses || 0), 0)
    const profit = totalRevenue - totalExpenses
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

    return (
        <Card className="overflow-hidden card-lift">
            <CardHeader className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            {t("revenueOverview")}
                        </CardTitle>
                        <CardDescription>
                            {t("monthlyTrends")}
                        </CardDescription>
                    </div>
                    <Tabs
                        defaultValue="area"
                        value={chartType}
                        onValueChange={(v) => setChartType(v as "area" | "bar")}
                        className="h-8"
                    >
                        <TabsList className="h-8 bg-muted/50">
                            <TabsTrigger value="area" className="text-xs px-2.5 h-7 data-[state=active]:bg-background">
                                Area
                            </TabsTrigger>
                            <TabsTrigger value="bar" className="text-xs px-2.5 h-7 data-[state=active]:bg-background">
                                Bar
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Summary chips */}
                <div className="flex flex-wrap gap-2">
                    <div className="inline-flex items-center gap-1.5 rounded-lg border bg-green-500/10 px-2.5 py-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                            {t("revenueLabel")}: {formatCurrency(totalRevenue)}
                        </span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-lg border bg-red-500/10 px-2.5 py-1.5">
                        <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                        <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                            {t("expensesLabel")}: {formatCurrency(totalExpenses)}
                        </span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-lg border bg-blue-500/10 px-2.5 py-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                            {t("profit")}: {formatCurrency(profit)}
                            <span className="ml-1 text-[10px] opacity-70 font-normal">
                                ({margin.toFixed(1)}% {t("margin")})
                            </span>
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            {chartType === "area" ? (
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--chart-2, hsl(142, 71%, 45%))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--chart-2, hsl(142, 71%, 45%))" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--chart-5, hsl(0, 72%, 51%))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--chart-5, hsl(0, 72%, 51%))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="month"
                                        stroke="currentColor"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        className="text-muted-foreground"
                                    />
                                    <YAxis
                                        stroke="currentColor"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}k`}
                                        className="text-muted-foreground"
                                    />
                                    <Tooltip
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="rounded-lg border bg-background p-3 shadow-sm">
                                                        <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
                                                        {payload.map((entry) => (
                                                            <div key={entry.name} className="flex items-center justify-between gap-4 text-sm">
                                                                <span className="flex items-center gap-1.5">
                                                                    <span
                                                                        className="h-2.5 w-2.5 rounded-full"
                                                                        style={{ background: entry.color }}
                                                                    />
                                                                    {entry.name === "revenue" ? t("revenueLabel") : t("expensesLabel")}
                                                                </span>
                                                                <span className="font-semibold">
                                                                    ₺{Number(entry.value).toLocaleString("tr-TR")}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )
                                            }
                                            return null
                                        }}
                                    />
                                    <Legend
                                        formatter={(value) => (
                                            <span className="text-xs text-muted-foreground">
                                                {value === "revenue" ? t("revenueLabel") : t("expensesLabel")}
                                            </span>
                                        )}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="var(--chart-2, hsl(142, 71%, 45%))"
                                        fill="url(#revenueGrad)"
                                        strokeWidth={2}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="expenses"
                                        stroke="var(--chart-5, hsl(0, 72%, 51%))"
                                        fill="url(#expenseGrad)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            ) : (
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="month"
                                        stroke="currentColor"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        className="text-muted-foreground"
                                    />
                                    <YAxis
                                        stroke="currentColor"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}k`}
                                        className="text-muted-foreground"
                                    />
                                    <Tooltip
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="rounded-lg border bg-background p-3 shadow-sm">
                                                        <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
                                                        {payload.map((entry) => (
                                                            <div key={entry.name} className="flex items-center justify-between gap-4 text-sm">
                                                                <span className="flex items-center gap-1.5">
                                                                    <span
                                                                        className="h-2.5 w-2.5 rounded-full"
                                                                        style={{ background: entry.color }}
                                                                    />
                                                                    {entry.name === "revenue" ? t("revenueLabel") : t("expensesLabel")}
                                                                </span>
                                                                <span className="font-semibold">
                                                                    ₺{Number(entry.value).toLocaleString("tr-TR")}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )
                                            }
                                            return null
                                        }}
                                    />
                                    <Legend
                                        formatter={(value) => (
                                            <span className="text-xs text-muted-foreground">
                                                {value === "revenue" ? t("revenueLabel") : t("expensesLabel")}
                                            </span>
                                        )}
                                    />
                                    <Bar
                                        dataKey="revenue"
                                        fill="var(--chart-2, hsl(142, 71%, 45%))"
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="expenses"
                                        fill="var(--chart-5, hsl(0, 72%, 51%))"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            {t("noData") || "Gelir verisi bulunamadı"}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
