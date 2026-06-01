"use client"

import { useTranslations } from "next-intl"
import { Package, ArrowRight } from "lucide-react"
import { Link } from "@/i18n/navigation"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatRelativeTime, formatCurrency } from "@/lib/utils"

// ── Status badge color mapping ──────────────────────────────────────────
const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    CONFIRMED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    PROCESSING: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    SHIPPED: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    DELIVERED: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    REFUNDED: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    ON_HOLD: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
}

interface RecentOrder {
    id: string
    orderNumber: string
    customerName: string
    status: string
    total: number
    itemCount: number
    createdAt: Date
}

interface RecentOrdersProps {
    orders?: RecentOrder[]
}

export function RecentOrders({ orders = [] }: RecentOrdersProps) {
    const t = useTranslations("dashboard")
    const tStatus = useTranslations("status")

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {t("recentOrders")}
                    </CardTitle>
                    <CardDescription>{t("latestOrders")}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                    <Link href="/finance/orders" className="flex items-center gap-1">
                        {t("viewAll")}
                        <ArrowRight className="h-3 w-3" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                {orders.length > 0 ? (
                    <div className="space-y-1">
                        {/* Table header */}
                        <div className="hidden md:grid md:grid-cols-[1fr_1.5fr_1fr_1fr_auto] gap-3 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            <span>{t("order")}</span>
                            <span>{t("customer")}</span>
                            <span>{t("status")}</span>
                            <span className="text-right">{t("total")}</span>
                            <span className="w-8" />
                        </div>
                        <ScrollArea className="h-[260px]">
                            <div className="divide-y">
                                {orders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr_1fr_auto] gap-1 md:gap-3 px-3 py-3 text-sm transition-colors hover:bg-muted/50 rounded-sm items-center"
                                    >
                                        {/* Mobile layout */}
                                        <div className="flex items-center justify-between md:contents">
                                            <span className="font-medium text-xs md:text-sm">
                                                {order.orderNumber}
                                            </span>
                                            <span className="text-xs text-muted-foreground md:hidden">
                                                {formatRelativeTime(order.createdAt)}
                                            </span>
                                        </div>
                                        <span className="text-muted-foreground text-xs md:text-sm truncate hidden md:block">
                                            {order.customerName}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] md:text-xs px-1.5 py-0 font-medium ${statusColors[order.status] || ""}`}
                                            >
                                                {tStatus(order.status) || order.status}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground md:hidden">
                                                {order.itemCount} {t("itemsLabel") || "ürün"}
                                            </span>
                                        </div>
                                        <span className="text-right font-medium text-xs md:text-sm">
                                            {formatCurrency(order.total)}
                                        </span>
                                        <span className="hidden md:block text-xs text-muted-foreground text-right w-8">
                                            {formatRelativeTime(order.createdAt)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                ) : (
                    <div className="flex h-[260px] items-center justify-center text-muted-foreground">
                        {t("noRecentOrders")}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
