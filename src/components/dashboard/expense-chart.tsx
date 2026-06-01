"use client"

import { useTranslations } from "next-intl"
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ExpenseChartProps {
    data?: { name: string; value: number }[]
}

const COLORS = [
    "var(--chart-1, hsl(221, 83%, 53%))", // Blue
    "var(--chart-2, hsl(142, 71%, 45%))", // Green
    "var(--chart-3, hsl(330, 65%, 60%))", // Pink/Purple
    "var(--chart-4, hsl(85, 60%, 50%))",  // Yellow-Green
    "var(--chart-5, hsl(30, 80%, 50%))",  // Orange
]

export function ExpenseChart({ data }: ExpenseChartProps) {
    const t = useTranslations("dashboard")
    const chartData = data || []
    const total = chartData.reduce((sum, item) => sum + item.value, 0)

    return (
        <Card className="overflow-hidden card-lift">
            <CardHeader>
                <CardTitle>{t("expensesByCategory")}</CardTitle>
                <CardDescription>
                    {t("monthlyTrends")}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const item = payload[0]!
                                            const percentage = (
                                                ((item.value as number) / total) *
                                                100
                                            ).toFixed(1)
                                            return (
                                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-sm font-medium">
                                                            {item.name}
                                                        </span>
                                                        <span className="text-sm text-muted-foreground">
                                                            ₺{(item.value as number).toLocaleString("tr-TR")} ({percentage}%)
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        }
                                        return null
                                    }}
                                />
                                <Legend
                                    layout="vertical"
                                    verticalAlign="middle"
                                    align="right"
                                    wrapperStyle={{
                                        fontSize: "13px",
                                        paddingLeft: "8px",
                                        overflow: "auto",
                                        maxHeight: "240px",
                                    }}
                                    formatter={(value) => (
                                        <span className="text-sm text-muted-foreground">{value}</span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            {t("noData") || "Gider verisi bulunamadı"}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
