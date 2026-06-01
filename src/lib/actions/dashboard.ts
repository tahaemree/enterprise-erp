"use server"

import { unstable_cache } from "next/cache"
import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import logger from "@/lib/logger"
import { DashboardService, type DashboardStatsDTO } from "@/services/dashboard.service"
import { activityLogService } from "@/services/activity-log.service"
import { serializePrisma } from "@/lib/utils"
import { ENTITY_TYPE_LABELS, LOG_ACTION_LABELS } from "@/lib/constants"

export type { DashboardStatsDTO as DashboardStats } from "@/services/dashboard.service"

const getCachedDashboardStats = unstable_cache(
    async (tenantId: string) => DashboardService.getDashboardStats(tenantId),
    ['dashboard-stats'],
    { revalidate: 300, tags: ['dashboard'] }
)

export async function getDashboardStats() {
    const user = await requireAuth()
    const stats = await getCachedDashboardStats(user.tenantId)
    return serializePrisma(stats)
}

export interface RevenueDataPoint {
    month: string
    revenue: number
}

const getCachedRevenueData = unstable_cache(
    async (tenantId: string) => {
        const db = getTenantPrisma(tenantId)
        const grouped = await db.transaction.groupBy({
            by: ["date"],
            where: { type: "INCOME" },
            _sum: { amount: true },
            orderBy: { date: "asc" },
        })
        const monthlyMap = new Map<string, number>()
        for (const row of grouped) {
            const month = row.date.toISOString().slice(0, 7)
            monthlyMap.set(month, (monthlyMap.get(month) || 0) + Number(row._sum.amount || 0))
        }
        return Array.from(monthlyMap.entries()).map(([month, revenue]) => ({
            month,
            revenue,
        }))
    },
    ['dashboard-revenue'],
    { revalidate: 3600, tags: ['dashboard', 'revenue'] }
)

export async function getRevenueData(): Promise<RevenueDataPoint[]> {
    const user = await requireAuth()
    const data = await getCachedRevenueData(user.tenantId)
    return serializePrisma(data)
}

export interface ExpenseCategory {
    name: string
    value: number
}

const getCachedExpensesByCategory = unstable_cache(
    async (tenantId: string) => {
        const db = getTenantPrisma(tenantId)
        const grouped = await db.transaction.groupBy({
            by: ["category"],
            where: { type: "EXPENSE" },
            _sum: { amount: true },
        })
        return grouped
            .filter((g) => g.category !== null)
            .map((g) => ({
                name: g.category ?? "Other",
                value: Number(g._sum.amount || 0),
            }))
    },
    ['dashboard-expenses'],
    { revalidate: 3600, tags: ['dashboard', 'expenses'] }
)

export async function getExpensesByCategory(): Promise<ExpenseCategory[]> {
    const user = await requireAuth()
    const data = await getCachedExpensesByCategory(user.tenantId)
    return serializePrisma(data)
}

export async function getCategoriesWithCount() {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    const categories = await db.category.findMany({
        include: { _count: { select: { products: true } } },
        orderBy: { name: "asc" },
    })

    return serializePrisma(categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        color: c.color || "#3B82F6",
        productCount: c._count.products,
    })))
}

export async function getSuppliersWithCount() {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    const suppliers = await db.supplier.findMany({
        include: { _count: { select: { products: true } } },
        orderBy: { name: "asc" },
    })

    return serializePrisma(suppliers.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        address: s.address,
        contactName: s.contactName,
        isActive: s.isActive,
        productCount: s._count.products,
    })))
}

export async function getLowStockProducts() {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    const products = await db.$queryRaw<
        Array<{
            id: string
            name: string
            sku: string
            quantity: number
            minStock: number
        }>
    >`
        SELECT id, name, sku, quantity, "minStock"
        FROM "Product"
        WHERE "tenantId" = ${user.tenantId}
        AND "quantity" <= "minStock"
        AND "isActive" = true
        AND "deletedAt" IS NULL
        ORDER BY "quantity" ASC
        LIMIT 10
    `

    return serializePrisma(products)
}

export interface ActivityItem {
    id: string
    action: string
    entityType: string
    description: string
    user: string
    createdAt: Date
}

const getCachedRecentActivity = unstable_cache(
    async (tenantId: string) => {
        const logs = await activityLogService.getRecentLogs(tenantId, 8)
        return logs.map((log) => ({
            id: log.id,
            action: LOG_ACTION_LABELS[log.action as keyof typeof LOG_ACTION_LABELS] || log.action.toLowerCase(),
            entityType: ENTITY_TYPE_LABELS[log.entityType as keyof typeof ENTITY_TYPE_LABELS] || log.entityType.toLowerCase(),
            description: log.description,
            user: log.user?.name || log.user?.email || "System",
            createdAt: log.createdAt,
        }))
    },
    ['dashboard-activity'],
    { revalidate: 300, tags: ['dashboard', 'activity'] }
)

export async function getRecentActivity(): Promise<ActivityItem[]> {
    const user = await requireAuth()
    const data = await getCachedRecentActivity(user.tenantId)
    return serializePrisma(data)
}

const getCachedRecentOrders = unstable_cache(
    async (tenantId: string) => DashboardService.getRecentOrders(tenantId),
    ['dashboard-recent-orders'],
    { revalidate: 300, tags: ['dashboard', 'recent-orders'] }
)

export async function getRecentOrders() {
    const user = await requireAuth()
    const data = await getCachedRecentOrders(user.tenantId)
    return serializePrisma(data)
}
