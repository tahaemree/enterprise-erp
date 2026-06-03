"use server"

import { revalidatePath } from "next/cache"
import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { orderSchema } from "@/lib/validations/finance"
import type { Prisma } from "@prisma/client"
import { getPaginationArgs, createPaginatedResult, type PaginationParams, type PaginatedResult } from "@/lib/pagination"
import { serializePrisma } from "@/lib/utils"
import { ENTITY_TYPE, PATHS } from "@/lib/constants"
import { validatedActionWithRole } from "@/lib/action-wrapper"
import { z } from "zod"
import { OrderService } from "@/services/order.service"

type OrderWithMapped = Prisma.OrderGetPayload<{
    include: { customer: true; items: true }
}> & { total: number; itemCount: number }

export interface OrderStats {
    total: number
    pending: number
    completed: number
    paidRevenue: number
}

export async function getOrderStats(): Promise<OrderStats> {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    const [total, pendingCount, completedCount, paidAgg] = await Promise.all([
        db.order.count(),
        db.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] } } }),
        db.order.count({ where: { status: { in: ["DELIVERED", "COMPLETED"] } } }),
        db.order.aggregate({
            _sum: { total: true },
            where: { paymentStatus: "paid" },
        }),
    ])

    return {
        total,
        pending: pendingCount,
        completed: completedCount,
        paidRevenue: Number(paidAgg._sum.total || 0),
    }
}

export async function getOrders(): Promise<OrderWithMapped[]>
export async function getOrders(params: PaginationParams): Promise<PaginatedResult<OrderWithMapped>>
export async function getOrders(params?: PaginationParams) {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    const pagination = getPaginationArgs(params)

    if (!pagination) {
        const orders = await db.order.findMany({
            where: {},
            include: { customer: true, items: true },
            orderBy: { createdAt: "desc" },
        })
        return serializePrisma(orders.map(mapOrder))
    }

    const [orders, total] = await Promise.all([
        db.order.findMany({
            ...pagination,
            where: {},
            include: { customer: true, items: true },
            orderBy: { createdAt: "desc" },
        }),
        db.order.count({ where: {} }),
    ])

    return createPaginatedResult(
        serializePrisma(orders.map(mapOrder)),
        total,
        params
    )
}

function mapOrder(order: { items: { length: number }; total: unknown }) {
    return {
        ...order,
        itemCount: order.items.length,
    }
}

export async function getOrder(id: string) {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    const order = await db.order.findFirst({
        where: { id },
        include: {
            customer: true,
            items: { include: { product: true } },
        },
    })
    return serializePrisma(order)
}

/**
 * Atomically creates an order and deducts stock within a Prisma $transaction.
 * This ensures that order creation and stock updates are atomic:
 * if either fails, BOTH operations are rolled back.
 */
export const createOrder = validatedActionWithRole(
    "MANAGER",
    orderSchema,
    ENTITY_TYPE.ORDER,
    PATHS.ORDERS,
    async (ctx) => {
        const orderService = new OrderService(ctx.db, ctx.user.tenantId)
        return await orderService.createOrder(ctx.parsed)
    },
    (parsed) => `Created order: #${parsed.orderNumber}`
)

export const deleteOrder = validatedActionWithRole(
    "MANAGER",
    z.object({ id: z.string().min(1) }),
    ENTITY_TYPE.ORDER,
    PATHS.ORDERS,
    async (ctx) => {
        const db = getTenantPrisma(ctx.user.tenantId)
        const orderService = new OrderService(db, ctx.user.tenantId)
        await orderService.deleteOrder(ctx.parsed.id)

        revalidatePath(PATHS.PRODUCTS)
        return { id: ctx.parsed.id }
    },
    (parsed) => `Deleted order: ${parsed.id}`,
    "DELETE"
)

export const updateOrderStatus = validatedActionWithRole(
    "MANAGER",
    z.object({
        id: z.string().min(1),
        status: z.enum(["DRAFT", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELLED", "REFUNDED", "ON_HOLD"]),
    }),
    ENTITY_TYPE.ORDER,
    PATHS.ORDERS,
    async (ctx) => {
        const orderService = new OrderService(ctx.db, ctx.user.tenantId)
        await orderService.updateOrderStatus(ctx.parsed.id, ctx.parsed.status)

        revalidatePath(PATHS.PRODUCTS)
        return { id: ctx.parsed.id }
    },
    (parsed) => `Updated order status to ${parsed.status}: ${parsed.id}`,
    "UPDATE"
)
