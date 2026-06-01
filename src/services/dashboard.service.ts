import { unstable_cache } from "next/cache"
import { getTenantPrisma } from "@/lib/prisma"

export interface DashboardStatsDTO {
    totalProducts: number
    totalCustomers: number
    totalEmployees: number
    totalOrders: number
    totalRevenue: number
    totalExpenses: number
    currentMonthRevenue: number
    currentMonthExpenses: number
    recentOrders: Array<{
        id: string
        orderNumber: string
        customerName: string
        status: string
        total: number
        itemCount: number
        createdAt: Date
    }>
    lowStockProducts: Array<{
        id: string
        name: string
        sku: string
        quantity: number
        minStock: number
        price: string
        unit: string
        isActive: boolean
    }>
    changes: {
        revenue: number
        expenses: number
        orders: number
        employees: number
        customers: number
        products: number
    }
}

export class DashboardService {
    /**
     * Dashboard istatistiklerini getirir.
     * Performans için belirli bölümleri önbelleğe (cache) alır.
     */
    static async getDashboardStats(tenantId: string): Promise<DashboardStatsDTO> {
        // Inner cache removed — caching is handled at the action level (unstable_cache wrapper)
        // This avoids double-cache overhead and redundant cache key computation.
        return DashboardService._fetchDashboardStats(tenantId)
    }

    /** @internal Fetches all dashboard data in parallel */
    private static async _fetchDashboardStats(tenantId: string): Promise<DashboardStatsDTO> {
                const db = getTenantPrisma(tenantId)
                const now = new Date()
                const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

                const [
                    totalProducts,
                    totalCustomers,
                    totalEmployees,
                    totalOrders,
                    recentOrdersRaw,
                    allFinancialAgg,
                    monthlyFinancialAgg,
                    prevMonthFinancialAgg,
                    prevMonthCounts,
                    lowStockProducts,
                ] = await Promise.all([
                    db.product.count(),
                    db.customer.count(),
                    db.employee.count(),
                    db.order.count(),
                    db.order.findMany({
                        select: {
                            id: true,
                            orderNumber: true,
                            status: true,
                            total: true,
                            createdAt: true,
                            customer: { select: { firstName: true, lastName: true } },
                            _count: { select: { items: true } }
                        },
                        orderBy: { createdAt: "desc" },
                        take: 5,
                    }),
                    db.transaction.groupBy({
                        by: ["type"],
                        where: { type: { in: ["INCOME", "EXPENSE"] } },
                        _sum: { amount: true },
                    }),
                    db.transaction.groupBy({
                        by: ["type"],
                        where: {
                            type: { in: ["INCOME", "EXPENSE"] },
                            date: { gte: firstOfMonth },
                        },
                        _sum: { amount: true },
                    }),
                    db.transaction.groupBy({
                        by: ["type"],
                        where: {
                            type: { in: ["INCOME", "EXPENSE"] },
                            date: { lt: firstOfMonth, gte: firstOfLastMonth },
                        },
                        _sum: { amount: true },
                    }),
                    Promise.all([
                        db.order.count({ where: { createdAt: { lt: firstOfMonth, gte: firstOfLastMonth } } }),
                        db.employee.count({ where: { createdAt: { lt: firstOfMonth, gte: firstOfLastMonth } } }),
                        db.customer.count({ where: { createdAt: { lt: firstOfMonth, gte: firstOfLastMonth } } }),
                        db.product.count({ where: { createdAt: { lt: firstOfMonth, gte: firstOfLastMonth } } }),
                    ]),
                    // Use raw SQL for column vs column comparison (quantity <= minStock)
                    db.$queryRaw<Array<{
                        id: string
                        name: string
                        sku: string
                        quantity: number
                        minStock: number
                        price: string
                        unit: string
                        isActive: boolean
                    }>>`
                        SELECT id, name, sku, quantity, "minStock", price, unit, "isActive"
                        FROM "Product"
                        WHERE "tenantId" = ${tenantId}
                        AND "deletedAt" IS NULL
                        AND "isActive" = true
                        AND quantity <= "minStock"
                        ORDER BY quantity ASC
                        LIMIT 5
                    `,
                ])

                const getSum = (agg: typeof allFinancialAgg, type: string) => Number(agg.find((a) => a.type === type)?._sum.amount ?? 0)

                const totalRevenue = getSum(allFinancialAgg, "INCOME")
                const totalExpenses = getSum(allFinancialAgg, "EXPENSE")
                const currentMonthRevenue = getSum(monthlyFinancialAgg, "INCOME")
                const currentMonthExpenses = getSum(monthlyFinancialAgg, "EXPENSE")
                const prevRevenue = getSum(prevMonthFinancialAgg, "INCOME")
                const prevExpenses = getSum(prevMonthFinancialAgg, "EXPENSE")

                const [prevOrderCount, prevEmployeeCount, prevCustomerCount, prevProductCount] = prevMonthCounts

                return {
                    totalProducts,
                    totalCustomers,
                    totalEmployees,
                    totalOrders,
                    totalRevenue,
                    totalExpenses,
                    currentMonthRevenue,
                    currentMonthExpenses,
                    recentOrders: recentOrdersRaw.map((order) => ({
                        id: order.id,
                        orderNumber: order.orderNumber,
                        customerName: order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : "Unknown",
                        status: order.status,
                        total: Number(order.total),
                        itemCount: order._count.items,
                        createdAt: order.createdAt,
                    })),
                    lowStockProducts: lowStockProducts.map((p) => ({
                        ...p,
                        quantity: Number(p.quantity),
                        minStock: Number(p.minStock),
                        price: String(p.price),
                    })),
                    changes: {
                        revenue: prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0,
                        expenses: prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 : 0,
                        orders: prevOrderCount > 0 ? ((totalOrders - prevOrderCount) / prevOrderCount) * 100 : 0,
                        employees: prevEmployeeCount > 0 ? ((totalEmployees - prevEmployeeCount) / prevEmployeeCount) * 100 : 0,
                        customers: prevCustomerCount > 0 ? ((totalCustomers - prevCustomerCount) / prevCustomerCount) * 100 : 0,
                        products: prevProductCount > 0 ? ((totalProducts - prevProductCount) / prevProductCount) * 100 : 0,
                    }
                }
    }

    static async getRecentOrders(tenantId: string) {
        const db = getTenantPrisma(tenantId)
        
        // Select kullanarak gereksiz verileri çekmeyi engelliyoruz ve _count ile itemCount'ı N+1'siz alıyoruz.
        const orders = await db.order.findMany({
            select: {
                id: true,
                orderNumber: true,
                status: true,
                total: true,
                createdAt: true,
                customer: { select: { firstName: true, lastName: true } },
                _count: { select: { items: true } }
            },
            orderBy: { createdAt: "desc" },
            take: 5,
        })

        return orders.map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : "Unknown",
            status: order.status,
            total: Number(order.total),
            itemCount: order._count.items,
            createdAt: order.createdAt,
        }))
    }
}
