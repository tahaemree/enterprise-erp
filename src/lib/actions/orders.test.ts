import { describe, it, expect, vi, beforeEach } from "vitest"
import { ZodError } from "zod"

// ─── Test Data ──────────────────────────────────────────────────────────

const mockUser = {
    id: "user-1",
    email: "admin@test.com",
    name: "Admin",
    role: "MANAGER" as const,
    tenantId: "tenant-1",
    tenantName: "Test Corp",
}

const mockProduct = {
    id: "prod-1",
    name: "Wireless Mouse",
    sku: "WM-001",
    quantity: 50,
}

const mockCustomer = {
    id: "cust-1",
    firstName: "John",
    lastName: "Doe",
}

const mockOrder = {
    id: "order-1",
    orderNumber: "ORD-001",
    customerId: "cust-1",
    status: "PENDING" as const,
    subtotal: 99.99,
    total: 99.99,
    notes: null,
    tenantId: "tenant-1",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    deletedAt: null,
    customer: mockCustomer,
    items: [
        {
            id: "item-1",
            productId: "prod-1",
            productName: "Wireless Mouse",
            productSku: "WM-001",
            quantity: 2,
            unitPrice: 49.995,
            total: 99.99,
            orderId: "order-1",
        },
    ],
}

const validOrderInput = {
    orderNumber: "ORD-001",
    customerId: "cust-1",
    status: "PENDING" as const,
    items: [
        { productId: "prod-1", quantity: 2, unitPrice: 49.995 },
    ],
    total: 99.99,
}

// ─── Mocks ──────────────────────────────────────────────────────────────

const mockDb = {
    order: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        updateMany: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
    },
    orderItem: {
        findMany: vi.fn(),
    },
    product: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        updateMany: vi.fn(),
        update: vi.fn(),
    },
    $transaction: vi.fn(),
}

const mockRequireAuth = vi.fn(() => Promise.resolve(mockUser))
const mockRequireManager = vi.fn()

vi.mock("@/lib/prisma", () => ({
    getTenantPrisma: vi.fn(() => mockDb),
    basePrisma: {},
    isUniqueConstraintError: vi.fn(() => false),
}))

vi.mock("@/lib/auth-utils", () => ({
    requireAuth: (...args: unknown[]) => mockRequireAuth(...args as []),
    requireManager: (...args: unknown[]) => mockRequireManager(...args as [unknown]),
}))

vi.mock("@/services/activity-log.service", () => ({
    activityLogService: { log: vi.fn() },
}))

vi.mock("@/lib/logger", () => ({
    default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
    unstable_cache: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
}))

// ─── Tests ──────────────────────────────────────────────────────────────

describe("Orders — Server Actions", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ── getOrders ───────────────────────────────────────────────────────

    describe("getOrders", () => {
        it("should return all orders without pagination", async () => {
            const mappedOrder = { ...mockOrder, itemCount: 1 }
            mockDb.order.findMany.mockResolvedValue([mappedOrder])

            const { getOrders } = await import("./orders")
            const result = await getOrders()

            expect(Array.isArray(result)).toBe(true)
            expect(result).toHaveLength(1)
            expect(result[0]).toMatchObject({
                id: "order-1",
                orderNumber: "ORD-001",
            })
        })

        it("should return paginated results", async () => {
            const mappedOrder = { ...mockOrder, itemCount: 1 }
            mockDb.order.findMany.mockResolvedValue([mappedOrder])
            mockDb.order.count.mockResolvedValue(1)

            const { getOrders } = await import("./orders")
            const result = await getOrders({ page: 1, pageSize: 10 })

            expect(result).toHaveProperty("data")
            expect(result).toHaveProperty("total", 1)
            expect(result).toHaveProperty("page", 1)
            expect((result as { data: unknown[] }).data).toHaveLength(1)
        })
    })

    // ── getOrder ────────────────────────────────────────────────────────

    describe("getOrder", () => {
        it("should return a single order with customer and items", async () => {
            mockDb.order.findFirst.mockResolvedValue({
                ...mockOrder,
                customer: mockCustomer,
                items: [
                    { ...mockOrder.items[0], product: mockProduct },
                ],
            })

            const { getOrder } = await import("./orders")
            const result = await getOrder("order-1")

            expect(result).toMatchObject({
                id: "order-1",
                orderNumber: "ORD-001",
                customer: expect.objectContaining({ firstName: "John" }),
            })
            expect(mockDb.order.findFirst).toHaveBeenCalledWith({
                where: { id: "order-1" },
                include: {
                    customer: true,
                    items: { include: { product: true } },
                },
            })
        })

        it("should return null for non-existent order", async () => {
            mockDb.order.findFirst.mockResolvedValue(null)

            const { getOrder } = await import("./orders")
            const result = await getOrder("nonexistent")

            expect(result).toBeNull()
        })
    })

    // ── createOrder ─────────────────────────────────────────────────────

    describe("createOrder", () => {
        it("should create an order and deduct stock atomically", async () => {
            // Mock product lookup (stock check)
            mockDb.product.findMany.mockResolvedValue([mockProduct])

            // Mock $transaction to execute the callback
            mockDb.$transaction.mockImplementation(async (cb: (tx: typeof mockDb) => unknown) => {
                return cb(mockDb)
            })

            // Mock order creation
            mockDb.order.create.mockResolvedValue(mockOrder)
            mockDb.product.updateMany.mockResolvedValue({ count: 1 })
            mockDb.product.update.mockResolvedValue({ ...mockProduct, quantity: 48 })

            const { createOrder } = await import("./orders")
            const result = await createOrder(validOrderInput)

            expect(result.ok).toBe(true)
            if (result.ok) {
                expect(result.data).toMatchObject({
                    id: "order-1",
                    orderNumber: "ORD-001",
                })
            }

            // Should check stock before transaction
            expect(mockDb.product.findMany).toHaveBeenCalled()

            // Should use $transaction for atomicity
            expect(mockDb.$transaction).toHaveBeenCalled()
        })

        it("should reject when product stock is insufficient", async () => {
            mockDb.product.findMany.mockResolvedValue([
                { ...mockProduct, quantity: 0 },
            ])
            mockDb.product.updateMany.mockResolvedValue({ count: 0 })

            const { createOrder } = await import("./orders")
            const result = await createOrder(validOrderInput)

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.code).toBe("CONFLICT")
            }
        })

        it("should reject when product is not found", async () => {
            mockDb.product.findMany.mockResolvedValue([])

            const { createOrder } = await import("./orders")
            const result = await createOrder(validOrderInput)

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.code).toBe("NOT_FOUND")
            }
        })

        it("should reject invalid input data", async () => {
            const { createOrder } = await import("./orders")
            const result = await createOrder({
                orderNumber: "",
                customerId: "",
                status: "PENDING",
                items: [],
                total: 0,
            })

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.fieldErrors).toBeDefined()
            }
        })
    })

    // ── deleteOrder ─────────────────────────────────────────────────────

    describe("deleteOrder", () => {
        it("should soft-delete an order and restore stock", async () => {
            mockDb.orderItem.findMany.mockResolvedValue([
                { productId: "prod-1", quantity: 2 },
            ])
            mockDb.$transaction.mockImplementation(async (cb: (tx: typeof mockDb) => unknown) => {
                return cb(mockDb)
            })
            mockDb.product.update.mockResolvedValue(mockProduct)
            mockDb.order.update.mockResolvedValue(mockOrder)

            const { deleteOrder } = await import("./orders")
            const result = await deleteOrder({ id: "order-1" })

            expect(result.ok).toBe(true)
            expect(mockDb.orderItem.findMany).toHaveBeenCalledWith({
                where: { orderId: "order-1" },
                select: { productId: true, quantity: true },
            })
            expect(mockDb.$transaction).toHaveBeenCalled()
            expect(mockDb.order.update).toHaveBeenCalledWith({
                where: { id: "order-1" },
                data: expect.objectContaining({ deletedAt: expect.any(Date) }),
            })
        })

        it("should handle empty order items gracefully", async () => {
            mockDb.orderItem.findMany.mockResolvedValue([])
            mockDb.$transaction.mockImplementation(async (cb: (tx: typeof mockDb) => unknown) => {
                return cb(mockDb)
            })
            mockDb.order.update.mockResolvedValue(mockOrder)

            const { deleteOrder } = await import("./orders")
            const result = await deleteOrder({ id: "order-1" })

            expect(result.ok).toBe(true)
        })
    })

    // ── updateOrderStatus ──────────────────────────────────────────────

    describe("updateOrderStatus", () => {
        it("should update order status successfully", async () => {
            mockDb.order.findUnique.mockResolvedValue({ ...mockOrder, items: [] })
            mockDb.order.update.mockResolvedValue(mockOrder)
            mockDb.$transaction.mockImplementation(async (cb: (tx: typeof mockDb) => unknown) => {
                return cb(mockDb)
            })

            const { updateOrderStatus } = await import("./orders")
            const result = await updateOrderStatus({ id: "order-1", status: "SHIPPED" })

            expect(result.ok).toBe(true)
            expect(mockDb.order.update).toHaveBeenCalledWith({
                where: { id: "order-1" },
                data: { status: "SHIPPED" },
            })
        })

        it("should return not-found when order does not exist", async () => {
            mockDb.order.findUnique.mockResolvedValue(null)

            const { updateOrderStatus } = await import("./orders")
            const result = await updateOrderStatus({ id: "nonexistent", status: "SHIPPED" })

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.code).toBe("NOT_FOUND")
            }
        })
    })
})
