import { OrderStatus } from "@prisma/client"
import { Money } from "@/lib/money"
import { calculateOrderTotals } from "@/lib/order-totals"
import { NotFoundError, ConflictError } from "@/lib/errors"
import { serializePrisma } from "@/lib/utils"
import type { TenantPrismaClient } from "@/lib/prisma"
import type { OrderFormValues } from "@/lib/validations/finance"

// The Service Layer handles PURE business logic. It does not know about "Next.js Actions", "revalidatePath", or "HTTP requests".
export class OrderService {
    // Accepts the tenant-scoped Prisma client (which carries $transaction and the
    // tenantId-injection/soft-delete extensions). No `as any` needed at call sites.
    constructor(private readonly db: TenantPrismaClient, private readonly tenantId: string) {}

    async createOrder(data: OrderFormValues) {
        const customer = await this.db.customer.findFirst({
            where: { id: data.customerId, tenantId: this.tenantId, deletedAt: null },
            select: { id: true },
        })
        if (!customer) {
            throw new NotFoundError("Customer")
        }

        // Resolve product names, SKUs and current stock levels inside the tenant boundary.
        const productIds = data.items.map((item) => item.productId)
        const products = await this.db.product.findMany({
            where: { id: { in: productIds }, tenantId: this.tenantId, deletedAt: null, isActive: true },
            select: { id: true, name: true, sku: true, quantity: true },
        })
        const productMap = new Map(products.map((p) => [p.id, p]))

        // Authoritative server-side totals (KDV / iskonto / kargo). The client
        // value is never trusted. Shared with the form via calculateOrderTotals.
        const taxRate = data.taxRate ?? 20
        const totals = calculateOrderTotals({
            items: data.items.map((item) => ({ quantity: item.quantity, unitPrice: item.unitPrice })),
            taxRate,
            discountType: data.discountType ?? "fixed",
            discountValue: data.discountValue ?? 0,
            shippingAmount: data.shippingAmount ?? 0,
        })

        const tx = await this.db.$transaction(async (prismaTx) => {
            // Deduct stock atomically and throw error if insufficient
            await Promise.all(
                data.items.map(async (item) => {
                    const product = productMap.get(item.productId)
                    if (!product) {
                        throw new NotFoundError(`Product ${item.productId}`)
                    }
                    
                    const updateResult = await prismaTx.product.updateMany({
                        where: { 
                            id: item.productId,
                            tenantId: this.tenantId,
                            deletedAt: null,
                            quantity: { gte: item.quantity } // Atomic constraint
                        },
                        data: { quantity: { decrement: item.quantity } },
                    })

                    if (updateResult.count === 0) {
                        throw new ConflictError(
                            `Insufficient stock for "${product.name}". Requested: ${item.quantity}`
                        )
                    }
                })
            )

            // Create the order with items
            return prismaTx.order.create({
                data: {
                    orderNumber: data.orderNumber,
                    customerId: data.customerId,
                    status: data.status,
                    subtotal: totals.subtotal,
                    taxRate,
                    taxAmount: totals.taxAmount,
                    discountType: data.discountType ?? "fixed",
                    discountValue: data.discountValue ?? 0,
                    discountAmount: totals.discountAmount,
                    shippingAmount: totals.shippingAmount,
                    total: totals.total,
                    currency: data.currency ?? "TRY",
                    tenantId: this.tenantId,
                    items: {
                        create: data.items.map((item) => {
                            const product = productMap.get(item.productId)
                            const lineTotal = new Money(item.unitPrice).multiply(item.quantity).round(2)
                            return {
                                productId: item.productId,
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                                taxRate,
                                taxAmount: lineTotal.percentage(taxRate).toNumber(),
                                total: lineTotal.toNumber(),
                                productName: product?.name ?? item.productName ?? "Unknown Product",
                                productSku: product?.sku ?? "",
                            }
                        }),
                    },
                },
                include: { items: true },
            })
        })

        return serializePrisma(tx)
    }

    async deleteOrder(id: string) {
        const order = await this.db.order.findFirst({
            where: { id, tenantId: this.tenantId, deletedAt: null },
            include: {
                items: {
                    select: { productId: true, quantity: true },
                },
            },
        })
        if (!order) {
            throw new NotFoundError("Order")
        }

        await this.db.$transaction(async (tx) => {
            // Restore stock
            await Promise.all(
                order.items
                    .filter((item): item is typeof item & { productId: string } => !!item.productId)
                    .map((item) =>
                        tx.product.updateMany({
                            where: { id: item.productId, tenantId: this.tenantId, deletedAt: null },
                            data: { quantity: { increment: item.quantity } },
                        })
                    )
            )
            // Soft delete order
            const updateResult = await tx.order.updateMany({
                where: { id, tenantId: this.tenantId, deletedAt: null },
                data: { deletedAt: new Date() } 
            })
            if (updateResult.count === 0) {
                throw new NotFoundError("Order")
            }
        })

        return { id }
    }

    async updateOrderStatus(id: string, status: OrderStatus) {
        const order = await this.db.order.findFirst({
            where: { id, tenantId: this.tenantId, deletedAt: null },
            include: { items: true },
        })

        if (!order) {
            throw new NotFoundError("Order")
        }

        const cancellingStatuses = ["CANCELLED", "REFUNDED"]
        const isCancelling = cancellingStatuses.includes(status)
        const wasCancelled = cancellingStatuses.includes(order.status)

        await this.db.$transaction(async (tx) => {
            if (isCancelling && !wasCancelled) {
                // Restore stock
                await Promise.all(
                    order.items
                        .filter((item): item is typeof item & { productId: string } => !!item.productId)
                        .map((item) =>
                            tx.product.updateMany({
                                where: { id: item.productId, tenantId: this.tenantId, deletedAt: null },
                                data: { quantity: { increment: item.quantity } },
                            })
                        )
                )
            } else if (!isCancelling && wasCancelled) {
                // Deduct stock again if reopening order
                await Promise.all(
                    order.items
                        .filter((item): item is typeof item & { productId: string } => !!item.productId)
                        .map(async (item) => {
                            const updateResult = await tx.product.updateMany({
                                where: { 
                                    id: item.productId,
                                    tenantId: this.tenantId,
                                    deletedAt: null,
                                    quantity: { gte: item.quantity }
                                },
                                data: { quantity: { decrement: item.quantity } },
                            })
                            if (updateResult.count === 0) {
                                throw new ConflictError(`Cannot reopen order: Insufficient stock for product ${item.productId}`)
                            }
                        })
                )
            }

            const updateResult = await tx.order.updateMany({
                where: { id, tenantId: this.tenantId, deletedAt: null },
                data: { status },
            })
            if (updateResult.count === 0) {
                throw new NotFoundError("Order")
            }
        })

        return { id }
    }
}
