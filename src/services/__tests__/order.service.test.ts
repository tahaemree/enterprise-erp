import { describe, expect, it, vi } from "vitest"
import { OrderService } from "@/services/order.service"
import { NotFoundError } from "@/lib/errors"

const tenantId = "tenant-1"

function asOrderDb(db: unknown): ConstructorParameters<typeof OrderService>[0] {
    return db as ConstructorParameters<typeof OrderService>[0]
}

function makeOrderInput(overrides: Record<string, unknown> = {}) {
    return {
        customerId: "customer-1",
        orderNumber: "ORD-1",
        status: "PENDING" as const,
        taxRate: 20,
        discountType: "fixed" as const,
        discountValue: 0,
        shippingAmount: 0,
        currency: "TRY",
        total: 10,
        items: [
            {
                productId: "product-1",
                productName: "Product 1",
                quantity: 2,
                unitPrice: 5,
            },
        ],
        ...overrides,
    }
}

describe("OrderService", () => {
    it("rejects order creation when the customer is not owned by the tenant", async () => {
        const db = {
            customer: { findFirst: vi.fn().mockResolvedValue(null) },
            product: { findMany: vi.fn() },
            $transaction: vi.fn(),
        }

        const service = new OrderService(asOrderDb(db), tenantId)

        await expect(service.createOrder(makeOrderInput())).rejects.toThrow(NotFoundError)
        expect(db.customer.findFirst).toHaveBeenCalledWith({
            where: { id: "customer-1", tenantId, deletedAt: null },
            select: { id: true },
        })
        expect(db.product.findMany).not.toHaveBeenCalled()
        expect(db.$transaction).not.toHaveBeenCalled()
    })

    it("creates orders with tenant-scoped customer, product and stock updates", async () => {
        const tx = {
            product: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
            order: { create: vi.fn().mockResolvedValue({ id: "order-1", items: [] }) },
        }
        const db = {
            customer: { findFirst: vi.fn().mockResolvedValue({ id: "customer-1" }) },
            product: {
                findMany: vi.fn().mockResolvedValue([
                    { id: "product-1", name: "Product 1", sku: "SKU-1", quantity: 5 },
                ]),
            },
            $transaction: vi.fn(async (handler) => handler(tx)),
        }

        const service = new OrderService(asOrderDb(db), tenantId)
        await service.createOrder(makeOrderInput())

        expect(db.product.findMany).toHaveBeenCalledWith({
            where: {
                id: { in: ["product-1"] },
                tenantId,
                deletedAt: null,
                isActive: true,
            },
            select: { id: true, name: true, sku: true, quantity: true },
        })
        expect(tx.product.updateMany).toHaveBeenCalledWith({
            where: {
                id: "product-1",
                tenantId,
                deletedAt: null,
                quantity: { gte: 2 },
            },
            data: { quantity: { decrement: 2 } },
        })
        expect(tx.order.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    customerId: "customer-1",
                    tenantId,
                    // 2 × 5 = 10 subtotal, %20 KDV = 2, total 12
                    subtotal: 10,
                    taxRate: 20,
                    taxAmount: 2,
                    total: 12,
                }),
            })
        )
    })

    it("applies discount and shipping to the persisted order totals", async () => {
        const tx = {
            product: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
            order: { create: vi.fn().mockResolvedValue({ id: "order-1", items: [] }) },
        }
        const db = {
            customer: { findFirst: vi.fn().mockResolvedValue({ id: "customer-1" }) },
            product: {
                findMany: vi.fn().mockResolvedValue([
                    { id: "product-1", name: "Product 1", sku: "SKU-1", quantity: 5 },
                ]),
            },
            $transaction: vi.fn(async (handler) => handler(tx)),
        }

        const service = new OrderService(asOrderDb(db), tenantId)
        // subtotal 10, %10 percentage discount = 1, base 9, %20 KDV = 1.8, +5 shipping = 15.8
        await service.createOrder(
            makeOrderInput({ discountType: "percentage", discountValue: 10, shippingAmount: 5 })
        )

        expect(tx.order.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    subtotal: 10,
                    discountAmount: 1,
                    taxAmount: 1.8,
                    shippingAmount: 5,
                    total: 15.8,
                }),
            })
        )
    })

    it("rejects delete when the order is not owned by the tenant", async () => {
        const db = {
            order: { findFirst: vi.fn().mockResolvedValue(null) },
            $transaction: vi.fn(),
        }

        const service = new OrderService(asOrderDb(db), tenantId)

        await expect(service.deleteOrder("order-1")).rejects.toThrow(NotFoundError)
        expect(db.order.findFirst).toHaveBeenCalledWith({
            where: { id: "order-1", tenantId, deletedAt: null },
            include: { items: { select: { productId: true, quantity: true } } },
        })
        expect(db.$transaction).not.toHaveBeenCalled()
    })

    it("soft-deletes orders and restores stock inside the tenant boundary", async () => {
        const tx = {
            product: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
            order: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
        }
        const db = {
            order: {
                findFirst: vi.fn().mockResolvedValue({
                    id: "order-1",
                    items: [{ productId: "product-1", quantity: 2 }],
                }),
            },
            $transaction: vi.fn(async (handler) => handler(tx)),
        }

        const service = new OrderService(asOrderDb(db), tenantId)
        await service.deleteOrder("order-1")

        expect(tx.product.updateMany).toHaveBeenCalledWith({
            where: { id: "product-1", tenantId, deletedAt: null },
            data: { quantity: { increment: 2 } },
        })
        expect(tx.order.updateMany).toHaveBeenCalledWith({
            where: { id: "order-1", tenantId, deletedAt: null },
            data: { deletedAt: expect.any(Date) },
        })
    })

    it("updates order status only after tenant-scoped lookup", async () => {
        const tx = {
            product: { updateMany: vi.fn() },
            order: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
        }
        const db = {
            order: {
                findFirst: vi.fn().mockResolvedValue({
                    id: "order-1",
                    status: "PENDING",
                    items: [],
                }),
            },
            $transaction: vi.fn(async (handler) => handler(tx)),
        }

        const service = new OrderService(asOrderDb(db), tenantId)
        await service.updateOrderStatus("order-1", "COMPLETED")

        expect(db.order.findFirst).toHaveBeenCalledWith({
            where: { id: "order-1", tenantId, deletedAt: null },
            include: { items: true },
        })
        expect(tx.order.updateMany).toHaveBeenCalledWith({
            where: { id: "order-1", tenantId, deletedAt: null },
            data: { status: "COMPLETED" },
        })
    })
})
