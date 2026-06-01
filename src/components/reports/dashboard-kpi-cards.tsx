"use client"

import { useTranslations } from "next-intl"
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    Users,
    Receipt,
    Percent,
    Wallet,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn, formatCurrency } from "@/lib/utils"
import type { KpiResult } from "@/lib/services/reporting-engine"

interface KpiCardProps {
    title: string
    value: string
    change: number
    icon: React.ElementType
    iconColor: string
    iconBg: string
    prefix?: string
    suffix?: string
    fromLastMonthLabel: string
}

function KpiCard({
    title,
    value,
    change,
    icon: Icon,
    iconColor,
    iconBg,
    prefix,
    suffix,
    fromLastMonthLabel,
}: KpiCardProps) {
    const isPositive = change >= 0
    return (
        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(var(--primary),0.1)] hover:-translate-y-1 hover:border-primary/30 cursor-default">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative flex flex-row items-center justify-between pb-2 z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {title}
                </CardTitle>
                <div className={cn("rounded-lg p-2 transition-transform duration-200 group-hover:scale-110", iconBg)}>
                    <Icon className={cn("h-4 w-4", iconColor)} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold tracking-tight">
                    {prefix}{value}{suffix}
                </div>
                <div className="flex items-center gap-1.5 text-xs mt-1">
                    <span
                        className={cn(
                            "flex items-center gap-0.5 font-medium",
                            isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
                        )}
                    >
                        {isPositive ? (
                            <TrendingUp className="h-3 w-3" />
                        ) : (
                            <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(change).toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">{fromLastMonthLabel}</span>
                </div>
            </CardContent>
        </Card>
    )
}

interface Props {
    data: KpiResult
}

export function DashboardKpiCards({ data }: Props) {
    const t = useTranslations("reports")
    const fromLastMonthLabel = t("fromLastMonth")

    const kpis = [
        {
            title: t("totalRevenue"),
            value: formatCurrency(data.revenue),
            change: data.revenueChange,
            icon: DollarSign,
            iconColor: "text-white",
            iconBg: "bg-green-500",
        },
        {
            title: t("totalExpenses"),
            value: formatCurrency(data.expenses),
            change: data.expensesChange,
            icon: Receipt,
            iconColor: "text-white",
            iconBg: "bg-red-500",
        },
        {
            title: t("profit"),
            value: formatCurrency(data.profit),
            change: data.profitChange,
            icon: Wallet,
            iconColor: "text-white",
            iconBg: data.profit >= 0 ? "bg-blue-500" : "bg-red-500",
        },
        {
            title: t("profitMargin"),
            value: data.profitMargin.toFixed(1),
            change: data.profitMarginChange,
            icon: Percent,
            iconColor: "text-white",
            iconBg: "bg-purple-500",
            suffix: "%",
        },
        {
            title: t("orderCount"),
            value: String(data.orderCount),
            change: data.orderCountChange,
            icon: ShoppingCart,
            iconColor: "text-white",
            iconBg: "bg-cyan-500",
        },
        {
            title: t("avgOrderValue"),
            value: formatCurrency(data.averageOrderValue),
            change: data.averageOrderValueChange,
            icon: TrendingUp,
            iconColor: "text-white",
            iconBg: "bg-indigo-500",
        },
        {
            title: t("customerCount"),
            value: String(data.customerCount),
            change: data.customerCountChange,
            icon: Users,
            iconColor: "text-white",
            iconBg: "bg-violet-500",
        },
        {
            title: t("revenuePerCustomer"),
            value: formatCurrency(data.revenuePerCustomer),
            change: data.revenuePerCustomerChange,
            icon: TrendingUp,
            iconColor: "text-white",
            iconBg: "bg-emerald-500",
        },
    ]

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {kpis.map((kpi) => (
                <KpiCard key={kpi.title} {...kpi} fromLastMonthLabel={fromLastMonthLabel} />
            ))}
        </div>
    )
}
