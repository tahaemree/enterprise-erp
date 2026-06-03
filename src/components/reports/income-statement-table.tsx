"use client"

import { useTranslations } from "next-intl"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn, formatCurrency } from "@/lib/utils"
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from "recharts"
import { TrendingDown, TrendingUp, Minus, AlertCircle } from "lucide-react"

import type { IncomeStatement, IncomeStatementLine } from "@/lib/services/reporting-engine"

const CHART_COLORS = [
    "hsl(0, 72%, 51%)",
    "hsl(25, 95%, 53%)",
    "hsl(38, 92%, 50%)",
    "hsl(142, 71%, 45%)",
    "hsl(221, 83%, 53%)",
    "hsl(280, 65%, 60%)",
    "hsl(330, 81%, 60%)",
    "hsl(190, 90%, 50%)",
]

interface Props {
    data: IncomeStatement
}

function LineRow({
    line,
    depth = 0,
    isPrevious: _isPrevious,
}: {
    line: IncomeStatementLine
    depth?: number
    isPrevious?: boolean
}) {
    const isNegative = line.amount < 0
    return (
        <>
            <TableRow
                className={cn(
                    line.isTotal ? "font-bold bg-muted/30" : "hover:bg-muted/50",
                )}
            >
                <TableCell
                    className={cn(
                        "py-2",
                        depth > 0 && "pl-8",
                        line.isTotal && "text-base",
                    )}
                >
                    {line.label}
                </TableCell>
                <TableCell className={`text-right font-mono tabular-nums py-2 ${isNegative ? "text-red-600" : ""}`}>
                    {formatCurrency(Math.abs(line.amount))}
                </TableCell>
            </TableRow>
            {line.children?.map((child, i) => (
                <LineRow key={`${child.label}-${i}`} line={child} depth={depth + 1} />
            ))}
        </>
    )
}

function ComparisonRow({
    label,
    current,
    previous,
    change: _change,
    changePercent,
    direction,
}: {
    label: string
    current: number
    previous: number
    change: number
    changePercent: number
    direction: "up" | "down" | "flat"
}) {
    const Icon = direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Minus
    const iconColor =
        direction === "up"
            ? "text-green-600"
            : direction === "down"
              ? "text-red-600"
              : "text-muted-foreground"

    return (
        <TableRow className="hover:bg-muted/50">
            <TableCell className="font-medium py-2">{label}</TableCell>
            <TableCell className="text-right font-mono tabular-nums py-2">
                {formatCurrency(current)}
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums text-muted-foreground py-2">
                {formatCurrency(previous)}
            </TableCell>
            <TableCell className="text-right py-2">
                <span className={cn("inline-flex items-center gap-1 font-medium text-sm", iconColor)}>
                    <Icon className="h-3.5 w-3.5" />
                    {changePercent >= 0 ? "+" : ""}
                    {changePercent.toFixed(1)}%
                </span>
            </TableCell>
        </TableRow>
    )
}

export function IncomeStatementTable({ data }: Props) {
    const t = useTranslations("reports")

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t("totalRevenue")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(data.totalRevenue)}
                        </div>
                        {data.previousPeriod && (
                            <p className="text-xs text-muted-foreground mt-1">
                                <TrendingUp className="inline h-3 w-3 mr-0.5" />
                                {data.previousPeriod.revenueChangePercent.toFixed(1)}% vs prev period
                            </p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t("totalExpenses")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(data.totalExpenses)}
                        </div>
                        {data.previousPeriod && (
                            <p className="text-xs text-muted-foreground mt-1">
                                <TrendingDown className="inline h-3 w-3 mr-0.5" />
                                {data.previousPeriod.expenseChangePercent.toFixed(1)}% vs prev period
                            </p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t("netProfit")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div
                            className={cn(
                                "text-2xl font-bold",
                                data.netProfit >= 0 ? "text-green-600" : "text-red-600",
                            )}
                        >
                            {formatCurrency(data.netProfit)}
                        </div>
                        {data.previousPeriod && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {data.previousPeriod.profitChangePercent.toFixed(1)}% vs prev period
                            </p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t("profitMargin")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div
                            className={cn(
                                "text-2xl font-bold",
                                data.profitMargin >= 0 ? "text-green-600" : "text-red-600",
                            )}
                        >
                            {data.profitMargin.toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t("expenseRatio")}: {data.expenseRatio.toFixed(1)}%
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Expense Breakdown Pie Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("expenseBreakdown")}</CardTitle>
                    <CardDescription>{t("expenseBreakdownDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[280px]">
                        {data.expenses.some((l) => l.amount > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.expenses
                                            .filter((l) => l.amount > 0)
                                            .map((l) => ({
                                                name: l.label,
                                                value: Math.abs(l.amount),
                                            }))}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {data.expenses
                                            .filter((l) => l.amount > 0)
                                            .map((_, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                                                />
                                            ))}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const item = payload[0]!
                                                const total = data.expenses
                                                    .filter((l) => l.amount > 0)
                                                    .reduce((s, l) => s + Math.abs(l.amount), 0)
                                                const pct = total > 0 ? ((item.value as number) / total) * 100 : 0
                                                return (
                                                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                        <p className="text-sm font-medium">{item.name}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {formatCurrency(item.value as number)} ({pct.toFixed(1)}%)
                                                        </p>
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
                                        formatter={(value) => (
                                            <span className="text-xs text-muted-foreground">{value}</span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                No expense data available
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Income Statement Table */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("incomeStatement")}</CardTitle>
                    <CardDescription>
                        {new Date(data.period.start).toLocaleDateString()} — {new Date(data.period.end).toLocaleDateString()}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[60%]">{t("account")}</TableHead>
                                <TableHead className="text-right">{t("amount")}</TableHead>
                                {data.previousPeriod && (
                                    <>
                                        <TableHead className="text-right">{t("previousPeriod")}</TableHead>
                                        <TableHead className="text-right">{t("change")}</TableHead>
                                    </>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Revenue Section */}
                            <TableRow className="bg-green-500/5">
                                <TableCell className="font-bold text-base py-3 text-green-700 dark:text-green-400">
                                    {t("revenue")}
                                </TableCell>
                                <TableCell className="text-right font-bold font-mono text-base text-green-700 dark:text-green-400 py-3">
                                    {formatCurrency(data.totalRevenue)}
                                </TableCell>
                                {data.previousPeriod && (
                                    <>
                                        <TableCell />
                                        <TableCell />
                                    </>
                                )}
                            </TableRow>
                            {data.revenue.map((line, i) => (
                                <LineRow key={`rev-${i}`} line={line} />
                            ))}

                            {/* Separator */}
                            <TableRow>
                                <TableCell colSpan={data.previousPeriod ? 4 : 2} className="h-4" />
                            </TableRow>

                            {/* Expense Section */}
                            <TableRow className="bg-red-500/5">
                                <TableCell className="font-bold text-base py-3 text-red-700 dark:text-red-400">
                                    {t("expenses")}
                                </TableCell>
                                <TableCell className="text-right font-bold font-mono text-base text-red-700 dark:text-red-400 py-3">
                                    {formatCurrency(data.totalExpenses)}
                                </TableCell>
                                {data.previousPeriod && (
                                    <>
                                        <TableCell />
                                        <TableCell />
                                    </>
                                )}
                            </TableRow>
                            {data.expenses.map((line, i) => (
                                <LineRow key={`exp-${i}`} line={line} />
                            ))}

                            {/* Separator */}
                            <TableRow>
                                <TableCell colSpan={data.previousPeriod ? 4 : 2} className="h-4" />
                            </TableRow>

                            {/* Net Profit */}
                            <TableRow
                                className={cn(
                                    "border-t-2",
                                    data.netProfit >= 0 ? "bg-green-500/10" : "bg-red-500/10",
                                )}
                            >
                                <TableCell className="font-bold text-lg py-4">
                                    {t("netProfit")}
                                </TableCell>
                                <TableCell
                                    className={cn(
                                        "text-right font-bold text-lg font-mono py-4",
                                        data.netProfit >= 0 ? "text-green-600" : "text-red-600",
                                    )}
                                >
                                    {formatCurrency(data.netProfit)}
                                </TableCell>
                                {data.previousPeriod && (
                                    <>
                                        <TableCell className="text-right font-mono text-muted-foreground py-4">
                                            {formatCurrency(data.previousPeriod.netProfit)}
                                        </TableCell>
                                        <TableCell className="text-right py-4">
                                            <Badge
                                                variant={data.previousPeriod.profitChangePercent >= 0 ? "default" : "destructive"}
                                                className="text-xs"
                                            >
                                                {data.previousPeriod.profitChangePercent >= 0 ? "+" : ""}
                                                {data.previousPeriod.profitChangePercent.toFixed(1)}%
                                            </Badge>
                                        </TableCell>
                                    </>
                                )}
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {data.previousPeriod && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            {t("periodComparison")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">{t("metric")}</TableHead>
                                    <TableHead className="text-right">{t("currentPeriod")}</TableHead>
                                    <TableHead className="text-right">{t("previousPeriod")}</TableHead>
                                    <TableHead className="text-right">{t("change")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <ComparisonRow
                                    label={t("totalRevenue")}
                                    current={data.totalRevenue}
                                    previous={data.previousPeriod.totalRevenue}
                                    change={data.totalRevenue - data.previousPeriod.totalRevenue}
                                    changePercent={data.previousPeriod.revenueChangePercent}
                                    direction={data.previousPeriod.revenueChangePercent >= 0 ? "up" : "down"}
                                />
                                <ComparisonRow
                                    label={t("totalExpenses")}
                                    current={data.totalExpenses}
                                    previous={data.previousPeriod.totalExpenses}
                                    change={data.totalExpenses - data.previousPeriod.totalExpenses}
                                    changePercent={data.previousPeriod.expenseChangePercent}
                                    direction={data.previousPeriod.expenseChangePercent >= 0 ? "up" : "down"}
                                />
                                <ComparisonRow
                                    label={t("netProfit")}
                                    current={data.netProfit}
                                    previous={data.previousPeriod.netProfit}
                                    change={data.netProfit - data.previousPeriod.netProfit}
                                    changePercent={data.previousPeriod.profitChangePercent}
                                    direction={data.previousPeriod.profitChangePercent >= 0 ? "up" : "down"}
                                />
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
