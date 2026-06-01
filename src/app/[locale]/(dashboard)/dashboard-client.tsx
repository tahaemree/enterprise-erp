"use client"

import { useTranslations } from "next-intl"
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingCart,
    Users,
    Package,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from "recharts"
import type { DashboardStats, RevenueDataPoint, ExpenseCategory } from "@/lib/actions/dashboard"

const COLORS = ["#2563eb", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6", "#ec4899"]

interface DashboardClientProps {
    stats: DashboardStats
    revenueData: RevenueDataPoint[]
    expenseCategories: ExpenseCategory[]
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value)
}

function formatNumber(value: number): string {
    return new Intl.NumberFormat("tr-TR").format(value)
}

function ChangeBadge({ value, suffix = "%" }: { value: number; suffix?: string }) {
    if (value === 0) return <Badge variant="outline" className="text-xs">—</Badge>
    const isPositive = value > 0
    return (
        <Badge variant={isPositive ? "default" : "destructive"} className="gap-1 text-xs">
            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {isPositive ? "+" : ""}{Math.round(value)}{suffix}
        </Badge>
    )
}

export function DashboardClient({ stats, revenueData, expenseCategories }: DashboardClientProps) {
    const t = useTranslations("dashboard")

    const kpiCards = [
        {
            title: t("totalRevenue", { fallback: "Total Revenue" }),
            value: formatCurrency(stats.totalRevenue),
            change: stats.changes.revenue,
            icon: DollarSign,
            iconClass: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/50",
        },
        {
            title: t("totalOrders", { fallback: "Total Orders" }),
            value: formatNumber(stats.totalOrders),
            change: stats.changes.orders,
            icon: ShoppingCart,
            iconClass: "text-blue-600 bg-blue-100 dark:bg-blue-950/50",
        },
        {
            title: t("totalCustomers", { fallback: "Total Customers" }),
            value: formatNumber(stats.totalCustomers),
            change: stats.changes.customers,
            icon: Users,
            iconClass: "text-violet-600 bg-violet-100 dark:bg-violet-950/50",
        },
        {
            title: t("totalProducts", { fallback: "Active Products" }),
            value: formatNumber(stats.totalProducts),
            change: stats.changes.products,
            icon: Package,
            iconClass: "text-amber-600 bg-amber-100 dark:bg-amber-950/50",
        },
    ]

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Page Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Activity className="h-7 w-7 text-muted-foreground" />
                    {t("title", { fallback: "Dashboard" })}
                </h1>
                <p className="text-muted-foreground">
                    {t("kpiSummary", { fallback: "Overview of your business performance" })}
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {kpiCards.map((kpi, i) => (
                    <Card key={i} className="border-0 shadow-sm transition-shadow hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {kpi.title}
                            </CardTitle>
                            <div className={`rounded-lg p-2 ${kpi.iconClass}`}>
                                <kpi.icon className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpi.value}</div>
                            <div className="mt-1 flex items-center gap-2">
                                <ChangeBadge value={kpi.change} />
                                <span className="text-xs text-muted-foreground">
                                    {t("monthlyComparison", { fallback: "vs last month" })}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Revenue Chart */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                            {t("revenueChart", { fallback: "Revenue Trend" })}
                        </CardTitle>
                        <CardDescription>
                            {t("revenueData", { fallback: "Monthly revenue for the current period" })}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
                                    <YAxis className="text-xs" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--popover))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px",
                                        }}
                                        formatter={(value) => [formatCurrency(Number(value)), t("revenue", { fallback: "Revenue" })] as [string, string]}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                                        activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Expense Distribution */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-red-500" />
                            {t("expenseDistribution", { fallback: "Expense Distribution" })}
                        </CardTitle>
                        <CardDescription>
                            {t("expenseData", { fallback: "Expenses by category" })}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={expenseCategories}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {expenseCategories.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--popover))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px",
                                        }}
                                        formatter={(value) => [formatCurrency(Number(value)), ""] as [string, string]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 flex flex-wrap justify-center gap-4">
                            {expenseCategories.map((cat, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="text-muted-foreground">{cat.name}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Orders & Low Stock */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Orders */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                            {t("recentOrders", { fallback: "Recent Orders" })}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.recentOrders.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-8 text-center">
                                {t("noOrders", { fallback: "No recent orders" })}
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {stats.recentOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                    >
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">{order.orderNumber}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {order.customerName} &middot; {order.itemCount} items
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">{formatCurrency(order.total)}</p>
                                            <Badge variant="secondary" className="text-xs">
                                                {order.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Low Stock Products */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Package className="h-5 w-5 text-amber-500" />
                            {t("lowStockTitle", { fallback: "Low Stock Products" })}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.lowStockProducts.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-8 text-center">
                                {t("noLowStock", { fallback: "All products are well stocked" })}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {stats.lowStockProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                    >
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">{product.name}</p>
                                            <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                                        </div>
                                        <Badge variant="destructive" className="text-xs">
                                            {product.quantity} / {product.minStock}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
