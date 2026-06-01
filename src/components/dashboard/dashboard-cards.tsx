import { getTranslations } from "next-intl/server"
import {
    DollarSign,
    ShoppingCart,
    Package,
    Users,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CreditCard,
    UserCheck,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn, formatCurrency } from "@/lib/utils"
import { getDashboardStats } from "@/lib/actions/dashboard"

interface StatCardProps {
    title: string
    value: string
    change: {
        value: number
        isPositive: boolean
    }
    icon: React.ElementType
    iconColor: string
    iconBg: string
    description?: string
}

function StatCard({
    title,
    value,
    change,
    icon: Icon,
    iconColor,
    iconBg,
    description,
}: StatCardProps) {
    return (
        <Card className="group overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 card-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {title}
                </CardTitle>
                <div className={cn("rounded-lg p-2 transition-transform duration-200 group-hover:scale-110", iconBg)}>
                    <Icon className={cn("h-4 w-4", iconColor)} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold tracking-tight">{value}</div>
                <div className="flex items-center gap-2 text-xs mt-1">
                    <span
                        className={cn(
                            "flex items-center gap-1 font-medium",
                            change.isPositive
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                        )}
                    >
                        {change.isPositive ? (
                            <TrendingUp className="h-3 w-3" />
                        ) : (
                            <TrendingDown className="h-3 w-3" />
                        )}
                        {change.value}%
                    </span>
                    <span className="text-muted-foreground">
                        {description || "vs last month"}
                    </span>
                </div>
            </CardContent>
        </Card>
    )
}

export async function DashboardCards() {
    const t = await getTranslations("dashboard")
    const data = await getDashboardStats()

    const changes = data.changes || { revenue: 0, orders: 0, employees: 0, customers: 0, products: 0 }

    const stats = [
        {
            title: t("totalRevenue"),
            value: formatCurrency(data.totalRevenue),
            change: {
                value: Math.abs(Math.round(changes.revenue * 10) / 10),
                isPositive: changes.revenue >= 0,
            },
            icon: DollarSign,
            iconColor: "text-white",
            iconBg: "bg-green-500",
            description: t("fromLastMonth"),
        },
        {
            title: t("totalOrders"),
            value: String(data.totalOrders),
            change: {
                value: Math.abs(Math.round(changes.orders * 10) / 10),
                isPositive: changes.orders >= 0,
            },
            icon: ShoppingCart,
            iconColor: "text-white",
            iconBg: "bg-blue-500",
            description: t("fromLastMonth"),
        },
        {
            title: t("totalProducts"),
            value: String(data.totalProducts),
            change: {
                value: Math.abs(Math.round((changes.products || 0) * 10) / 10),
                isPositive: (changes.products || 0) >= 0,
            },
            icon: Package,
            iconColor: "text-white",
            iconBg: "bg-cyan-500",
            description: t("fromLastMonth"),
        },
        {
            title: t("totalCustomers"),
            value: String(data.totalCustomers),
            change: {
                value: Math.abs(Math.round((changes.customers || 0) * 10) / 10),
                isPositive: (changes.customers || 0) >= 0,
            },
            icon: UserCheck,
            iconColor: "text-white",
            iconBg: "bg-violet-500",
            description: t("fromLastMonth"),
        },
        {
            title: t("lowStock"),
            value: String(data.lowStockProducts.length),
            change: { value: 0, isPositive: false },
            icon: AlertTriangle,
            iconColor: "text-white",
            iconBg: "bg-yellow-500",
            description: t("itemsNeedRestocking"),
        },
        {
            title: t("totalEmployees"),
            value: String(data.totalEmployees),
            change: {
                value: Math.abs(Math.round(changes.employees * 10) / 10),
                isPositive: changes.employees >= 0,
            },
            icon: Users,
            iconColor: "text-white",
            iconBg: "bg-purple-500",
            description: t("fromLastMonth"),
        },
    ]

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {stats.map((stat) => (
                <StatCard key={stat.title} {...stat} />
            ))}
        </div>
    )
}
