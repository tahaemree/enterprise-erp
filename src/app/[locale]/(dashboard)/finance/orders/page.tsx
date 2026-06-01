import { Link } from "@/i18n/navigation"
import { Plus, ShoppingCart, Clock, CheckCircle } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { OrdersTable } from "@/components/finance/orders-table"
import { type Order } from "@/components/finance/order-columns"
import { formatCurrency } from "@/lib/utils"
import { getOrders, getOrderStats } from "@/lib/actions/orders"

export default async function OrdersPage({
    params: _params,
    searchParams,
}: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const t = await getTranslations("finance.orders")
    const resolvedSearchParams = await searchParams
    const page = Number(resolvedSearchParams?.page) || 1
    const limit = Number(resolvedSearchParams?.limit) || 10
    const search = typeof resolvedSearchParams?.search === "string" ? resolvedSearchParams.search : undefined

    const [paginatedOrders, stats] = await Promise.all([
        getOrders({ page, pageSize: limit, search }),
        getOrderStats(),
    ])

    const ordersData = "data" in paginatedOrders ? paginatedOrders.data : paginatedOrders
    const pageCount = "totalPages" in paginatedOrders ? paginatedOrders.totalPages : 1

    const orders: Order[] = ordersData.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.customer
            ? {
                  id: order.customer.id,
                  firstName: order.customer.firstName,
                  lastName: order.customer.lastName,
                  company: order.customer.company || undefined,
              }
            : { id: "", firstName: "Unknown", lastName: "" },
        status: order.status,
        total: Number(order.total),
        itemCount: order.items?.length || 0,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
    }))

    const totalOrders = stats.total
    const pendingOrders = stats.pending
    const completedOrders = stats.completed
    const totalRev = stats.paidRevenue

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button asChild>
                    <Link href="/finance/orders/new">
                        <Plus className="mr-2 h-4 w-4" />
                        {t("addOrder")}
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {t("totalOrders")}
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">{totalOrders}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {t("inProgress")}
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">{pendingOrders}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {t("completed")}
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">{completedOrders}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">💰</span>
                        <span className="text-sm font-medium text-muted-foreground">
                            {t("revenue")}
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">{formatCurrency(totalRev)}</p>
                </div>
            </div>

            <OrdersTable 
                data={orders} 
                pageCount={pageCount}
                pagination={{ pageIndex: page - 1, pageSize: limit }}
            />
        </div>
    )
}
