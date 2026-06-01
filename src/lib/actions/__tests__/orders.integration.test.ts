/**
 * Integration Tests: Orders Module
 *
 * Tests order server actions with a real PostgreSQL database.
 * Covers: Full order creation with items, stock tracking, status transitions,
 * customer-order relationships, tenant isolation, cross-module data integrity.
 */

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from "vitest"
import {
    setupIntegrationTest,
    cleanupTestData,
    type TestContext,
} from "@/lib/__tests__/integration-setup"
import { prisma } from "@/lib/prisma"
import { AuthorizationError } from "@/lib/errors"

let ctx: TestContext
let testCustomerId: string
let testProductId: string
let orderCounter = 0

// ─── Mock setup ─────────────────────────────────────────────────────────

const mockRequireAuth = vi.fn()
const mockRequireManager = vi.fn()

vi.mock("@/lib/auth-utils", () => ({
    requireAuth: (...args: unknown[]) => mockRequireAuth(...args as []),
    requireManager: (...args: unknown[]) => mockRequireManager(...args as [unknown]),
    requireRole: vi.fn(),
    requireAdmin: vi.fn(),
    verifyTenantAccess: vi.fn(),
}))

// ─── Lifecycle ──────────────────────────────────────────────────────────

beforeAll(async () => {
    const setup = await setupIntegrationTest()
    ctx = setup.context

    mockRequireAuth.mockResolvedValue({
        id: ctx.userId,
        email: `test-${ctx.tenantId}@test.com`,
        name: "Test Admin",
        role: "ADMIN",
        tenantId: ctx.tenantId,
        tenantName: "Test Tenant",
    })

    mockRequireManager.mockImplementation(() => {})

    // Create shared test data (customer + product)
    const customer = await prisma.customer.create({
        data: {
            firstName: "Order",
            lastName: "Customer",
            email: `order.customer.${Date.now()}@test.com`,
            status: "CUSTOMER",
            source: "DIRECT",
            tenantId: ctx.tenantId,
        },
    })
    testCustomerId = customer.id

    const product = await prisma.product.create({
        data: {
            name: "Order Test Product",
            sku: `ORDER-PROD-${Date.now()}`,
            price: 49.99,
            costPrice: 29.99,
            quantity: 100,
            minStock: 10,
            unit: "piece",
            tenantId: ctx.tenantId,
        },
    })
    testProductId = product.id
})

afterAll(async () => {
    await cleanupTestData(ctx)
})

beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue({
        id: ctx.userId,
        email: `test-${ctx.tenantId}@test.com`,
        name: "Test Admin",
        role: "ADMIN",
        tenantId: ctx.tenantId,
        tenantName: "Test Tenant",
    })
    mockRequireManager.mockImplementation(() => {})
})

// ─── Tests ──────────────────────────────────────────────────────────────

describe("Orders Integration — Full Order Lifecycle", () => {
    it("should create an order with items", async () => {
        const { createOrder } = await import("../orders")
        orderCounter++
        const result = await createOrder({
            customerId: testCustomerId,
            orderNumber: `INT-ORDER-${Date.now()}-${orderCounter}`,
            items: [
                {
                    productId: testProductId,
                    productName: "Order Test Product",
                    quantity: 3,
                    unitPrice: 49.99,
                    total: 149.97,
                },
            ],
            subtotal: 149.97,
            taxRate: 18,
            taxAmount: 26.99,
            total: 176.96,
            currency: "TRY",
            status: "PENDING",
            paymentStatus: "unpaid",
        })

        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.data.orderNumber).toBeDefined()
            expect(result.data.status).toBe("PENDING")
            expect(result.data.tenantId).toBe(ctx.tenantId)
            expect(result.data.items).toHaveLength(1)
            expect(result.data.items[0]!.productName).toBe("Order Test Product")
            expect(result.data.items[0]!.quantity).toBe(3)

            // Verify the order is linked to the customer
            expect(result.data.customerId).toBe(testCustomerId)

            // Clean up
            await prisma.orderItem.deleteMany({ where: { orderId: result.data.id } })
            await prisma.order.delete({ where: { id: result.data.id } })
        }
    })

    it("should create an order with multiple items", async () => {
        // Create a second product
        const product2 = await prisma.product.create({
            data: {
                name: "Second Order Product",
                sku: `ORDER-PROD2-${Date.now()}`,
                price: 19.99,
                quantity: 200,
                minStock: 10,
                unit: "piece",
                tenantId: ctx.tenantId,
            },
        })

        const { createOrder } = await import("../orders")
        orderCounter++
        const result = await createOrder({
            customerId: testCustomerId,
            orderNumber: `INT-ORDER-${Date.now()}-${orderCounter}`,
            items: [
                {
                    productId: testProductId,
                    productName: "Order Test Product",
                    quantity: 2,
                    unitPrice: 49.99,
                    total: 99.98,
                },
                {
                    productId: product2.id,
                    productName: "Second Order Product",
                    quantity: 5,
                    unitPrice: 19.99,
                    total: 99.95,
                },
            ],
            subtotal: 199.93,
            taxRate: 18,
            taxAmount: 35.99,
            total: 235.92,
            currency: "TRY",
            status: "PENDING",
            paymentStatus: "unpaid",
        })

        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.data.items).toHaveLength(2)

            const itemNames = result.data.items.map(i => i.productName)
            expect(itemNames).toContain("Order Test Product")
            expect(itemNames).toContain("Second Order Product")

            // Clean up
            await prisma.orderItem.deleteMany({ where: { orderId: result.data.id } })
            await prisma.order.delete({ where: { id: result.data.id } })
        }

        await prisma.product.delete({ where: { id: product2.id } })
    })

    it("should reject order with invalid customer", async () => {
        const { createOrder } = await import("../orders")
        orderCounter++
        const result = await createOrder({
            customerId: "non-existent-customer-id",
            orderNumber: `INT-ORDER-${Date.now()}-${orderCounter}`,
            items: [{
                productId: testProductId,
                productName: "Test",
                quantity: 1,
                unitPrice: 10,
                total: 10,
            }],
            subtotal: 10,
            taxRate: 18,
            taxAmount: 1.80,
            total: 11.80,
            currency: "TRY",
            status: "PENDING",
            paymentStatus: "unpaid",
        })

        expect(result.ok).toBe(false)
    })

    it("should reject order with empty items list", async () => {
        const { createOrder } = await import("../orders")
        orderCounter++
        const result = await createOrder({
            customerId: testCustomerId,
            orderNumber: `INT-ORDER-${Date.now()}-${orderCounter}`,
            items: [],
            subtotal: 0,
            taxRate: 18,
            taxAmount: 0,
            total: 0,
            currency: "TRY",
            status: "PENDING",
            paymentStatus: "unpaid",
        })

        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.fieldErrors).toBeDefined()
        }
    })

    it("should update order status", async () => {
        // Create an order first
        const order = await prisma.order.create({
            data: {
                orderNumber: `STATUS-TEST-${Date.now()}`,
                customerId: testCustomerId,
                status: "PENDING",
                subtotal: 100,
                total: 118,
                currency: "TRY",
                tenantId: ctx.tenantId,
            },
        })

        const { updateOrderStatus } = await import("../orders")
        const result = await updateOrderStatus({ id: order.id, status: "CONFIRMED" })

        expect(result.ok).toBe(true)

        // Verify
        const updated = await prisma.order.findUnique({ where: { id: order.id } })
        expect(updated?.status).toBe("CONFIRMED")

        // Clean up
        await prisma.order.delete({ where: { id: order.id } })
    })

    it("should delete (soft) an order", async () => {
        const order = await prisma.order.create({
            data: {
                orderNumber: `DELETE-TEST-${Date.now()}`,
                customerId: testCustomerId,
                status: "DRAFT",
                subtotal: 50,
                total: 59,
                currency: "TRY",
                tenantId: ctx.tenantId,
            },
        })

        const { deleteOrder } = await import("../orders")
        const result = await deleteOrder({ id: order.id })

        expect(result.ok).toBe(true)

        // Verify soft delete
        const raw = await prisma.order.findUnique({ where: { id: order.id } })
        expect(raw?.deletedAt).not.toBeNull()

        // Hard delete cleanup
        await prisma.order.delete({ where: { id: order.id } })
    })

    it("should list orders with pagination and filtering", async () => {
        // Create multiple orders
        const orders = await Promise.all([
            prisma.order.create({
                data: { orderNumber: `LIST-A-${Date.now()}`, customerId: testCustomerId, status: "PENDING", subtotal: 100, total: 118, currency: "TRY", tenantId: ctx.tenantId },
            }),
            prisma.order.create({
                data: { orderNumber: `LIST-B-${Date.now()}`, customerId: testCustomerId, status: "CONFIRMED", subtotal: 200, total: 236, currency: "TRY", tenantId: ctx.tenantId },
            }),
            prisma.order.create({
                data: { orderNumber: `LIST-C-${Date.now()}`, customerId: testCustomerId, status: "COMPLETED", subtotal: 300, total: 354, currency: "TRY", tenantId: ctx.tenantId },
            }),
        ])

        const { getOrders } = await import("../orders")

        const result = await getOrders({ page: 1, pageSize: 2 })

        expect(result.data).toBeDefined()
        expect(result.data).toHaveLength(2)
        expect(result.total).toBeGreaterThanOrEqual(3)
        expect(result.hasMore).toBe(true)

        // Clean up
        await prisma.order.deleteMany({ where: { id: { in: orders.map(o => o.id) } } })
    })

    it("should link customer to order", async () => {
        const { createOrder } = await import("../orders")
        orderCounter++
        const result = await createOrder({
            customerId: testCustomerId,
            orderNumber: `INT-ORDER-${Date.now()}-${orderCounter}`,
            items: [{
                productId: testProductId,
                productName: "Order Test Product",
                quantity: 1,
                unitPrice: 49.99,
                total: 49.99,
            }],
            subtotal: 49.99,
            taxRate: 18,
            taxAmount: 9.00,
            total: 58.99,
            currency: "TRY",
            status: "PENDING",
            paymentStatus: "unpaid",
        })

        expect(result.ok).toBe(true)
        if (result.ok) {
            // Verify customer data through prisma query
            const orderWithCustomer = await prisma.order.findUnique({
                where: { id: result.data.id },
                include: { customer: true },
            })
            expect(orderWithCustomer?.customer.firstName).toBe("Order")
            expect(orderWithCustomer?.customer.lastName).toBe("Customer")

            // Clean up
            await prisma.orderItem.deleteMany({ where: { orderId: result.data.id } })
            await prisma.order.delete({ where: { id: result.data.id } })
        }
    })

    it("should enforce tenant isolation on orders", async () => {
        // Create order in other tenant
        const otherTenant = await prisma.tenant.create({
            data: {
                name: "Other Tenant Orders",
                slug: `other-orders-${Date.now()}`,
                plan: "FREE",
                isActive: true,
            },
        })
        const otherCustomer = await prisma.customer.create({
            data: {
                firstName: "Other",
                lastName: "Customer",
                email: `other.${Date.now()}@test.com`,
                status: "CUSTOMER",
                source: "DIRECT",
                tenantId: otherTenant.id,
            },
        })
        const otherOrder = await prisma.order.create({
            data: {
                orderNumber: `OTHER-ORDER-${Date.now()}`,
                customerId: otherCustomer.id,
                status: "PENDING",
                subtotal: 500,
                total: 590,
                currency: "TRY",
                tenantId: otherTenant.id,
            },
        })

        const { getOrders } = await import("../orders")

        // Our tenant should not see this order
        const orderList = await getOrders()
        expect(Array.isArray(orderList)).toBe(true)
        const found = orderList.find((o: { id: string }) => o.id === otherOrder.id)
        expect(found).toBeUndefined()

        // Clean up
        await prisma.order.delete({ where: { id: otherOrder.id } })
        await prisma.customer.delete({ where: { id: otherCustomer.id } })
        await prisma.tenant.delete({ where: { id: otherTenant.id } })
    })

    it("should reject non-MANAGER role for order creation", async () => {
        mockRequireManager.mockImplementationOnce(() => {
            throw new AuthorizationError("Insufficient permissions")
        })

        const { createOrder } = await import("../orders")
        const result = await createOrder({
            customerId: testCustomerId,
            items: [{
                productId: testProductId,
                productName: "Test",
                quantity: 1,
                unitPrice: 10,
                total: 10,
            }],
            subtotal: 10,
            taxRate: 18,
            taxAmount: 1.80,
            total: 11.80,
            currency: "TRY",
            status: "PENDING",
            paymentStatus: "unpaid",
        })

        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.code).toBe("FORBIDDEN")
        }
    })
})
