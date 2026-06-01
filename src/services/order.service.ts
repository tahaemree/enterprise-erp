import { PrismaClient, Prisma, OrderStatus } from "@prisma/client"
import { Money } from "@/lib/money"
import { NotFoundError, ConflictError } from "@/lib/errors"
import { serializePrisma } from "@/lib/utils"
import type { OrderFormValues } from "@/lib/validations/finance"

// The Service Layer handles PURE business logic. It does not know about "Next.js Actions", "revalidatePath", or "HTTP requests".
export class OrderService {
    constructor(private readonly db: PrismaClient | Prisma.TransactionClient, private readonly tenantId: string) {}

    async createOrder(data: OrderFormValues) {
        // Resolve product names, SKUs and current stock levels
        const productIds = data.items.map((item) => item.productId)
        const products = await this.db.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true, sku: true, quantity: true },
        })
        const productMap = new Map(products.map((p) => [p.id, p]))

        // Calculate total server-side using Money for precision
        const calculatedTotal = data.items.reduce((sum, item) => {
            return sum + new Money(item.unitPrice).multiply(item.quantity).round(2).toNumber()
        }, 0)

        // Ensure we are using a transaction context if not already provided,
        // but typically the caller should wrap this if needed, or we do it here.
        // For simplicity, we assume this method itself wraps in a transaction if this.db is not one.
        // Prisma doesn't have an easy "isTransaction" flag, so we'll just start a new one.
        const tx = await (this.db as PrismaClient).$transaction(async (prismaTx) => {
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
                    subtotal: calculatedTotal,
                    total: calculatedTotal,
                    tenantId: this.tenantId,
                    items: {
                        create: data.items.map((item) => {
                            const product = productMap.get(item.productId)
                            return {
                                productId: item.productId,
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                                total: new Money(item.unitPrice).multiply(item.quantity).round(2).toNumber(),
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
        const orderItems = await this.db.orderItem.findMany({
            where: { orderId: id },
            select: { productId: true, quantity: true },
        })

        await (this.db as PrismaClient).$transaction(async (tx) => {
            // Restore stock
            await Promise.all(
                orderItems
                    .filter((item): item is typeof item & { productId: string } => !!item.productId)
                    .map((item) =>
                        tx.product.update({
                            where: { id: item.productId },
                            data: { quantity: { increment: item.quantity } },
                        })
                    )
            )
            // Soft delete order
            await tx.order.update({ 
                where: { id },
                data: { deletedAt: new Date() } 
            })
        })

        return { id }
    }

    async updateOrderStatus(id: string, status: OrderStatus) {
        const order = await this.db.order.findUnique({
            where: { id },
            include: { items: true },
        })

        if (!order) {
            throw new NotFoundError("Order")
        }

        const cancellingStatuses = ["CANCELLED", "REFUNDED"]
        const isCancelling = cancellingStatuses.includes(status)
        const wasCancelled = cancellingStatuses.includes(order.status)

        await (this.db as PrismaClient).$transaction(async (tx) => {
            if (isCancelling && !wasCancelled) {
                // Restore stock
                await Promise.all(
                    order.items
                        .filter((item): item is typeof item & { productId: string } => !!item.productId)
                        .map((item) =>
                            tx.product.updateMany({
                                where: { id: item.productId },
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

            await tx.order.update({
                where: { id },
                data: { status },
            })
        })

        return { id }
    }
}
