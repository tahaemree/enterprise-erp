import { describe, it, expect, vi, beforeEach } from "vitest"

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
    description: "A high-quality wireless mouse",
    sku: "WM-001",
    barcode: "1234567890123",
    price: 49.99,
    costPrice: 25.0,
    quantity: 50,
    minStock: 10,
    maxStock: 100,
    unit: "piece",
    categoryId: "cat-1",
    supplierId: "sup-1",
    isActive: true,
    tenantId: "tenant-1",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    deletedAt: null,
    category: { id: "cat-1", name: "Electronics" },
    supplier: { id: "sup-1", name: "TechDistributor" },
}

const validProductInput = {
    name: "Wireless Mouse",
    sku: "WM-001",
    price: 49.99,
    quantity: 50,
    minStock: 10,
    unit: "piece",
    isActive: true,
}

// ─── Mocks ──────────────────────────────────────────────────────────────

const mockDb = {
    product: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        updateMany: vi.fn(),
        count: vi.fn(),
    },
}

vi.mock("@/lib/prisma", () => ({
    getTenantPrisma: vi.fn(() => mockDb),
    basePrisma: { $queryRaw: vi.fn() },
    isUniqueConstraintError: vi.fn((err: unknown) =>
        typeof err === "object" && err !== null && (err as { code: string }).code === "P2002"
    ),
}))

const mockRequireAuth = vi.fn(() => Promise.resolve(mockUser))
const mockRequireManager = vi.fn()

vi.mock("@/lib/auth-utils", () => ({
    requireAuth: (...args: unknown[]) => mockRequireAuth(...args as []),
    requireManager: (...args: unknown[]) => mockRequireManager(...args as [unknown]),
}))

vi.mock("@/services/activity-log.service", () => ({
    activityLogService: { log: vi.fn() },
}))

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
    unstable_cache: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
}))

// ─── Tests ──────────────────────────────────────────────────────────────

describe("Products — Server Actions", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ── createProduct ───────────────────────────────────────────────────

    describe("createProduct", () => {
        it("should create a product successfully", async () => {
            mockDb.product.create.mockResolvedValue(mockProduct)

            const { createProduct } = await import("./products")
            const result = await createProduct(validProductInput)

            expect(result.ok).toBe(true)
            if (result.ok) {
                expect(result.data).toMatchObject({
                    id: "prod-1",
                    name: "Wireless Mouse",
                    sku: "WM-001",
                })
            }
            expect(mockDb.product.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        name: "Wireless Mouse",
                        sku: "WM-001",
                        tenantId: "tenant-1",
                    }),
                })
            )
        })

        it("should reject missing required fields", async () => {
            const { createProduct } = await import("./products")
            const result = await createProduct({ name: "", sku: "" })

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.fieldErrors).toBeDefined()
            }
            expect(mockDb.product.create).not.toHaveBeenCalled()
        })

        it("should reject SKU shorter than 2 characters", async () => {
            const { createProduct } = await import("./products")
            const result = await createProduct({
                ...validProductInput,
                sku: "X",
            })

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.fieldErrors).toBeDefined()
            }
        })

        it("should handle duplicate SKU gracefully", async () => {
            const conflictError = new Error("Unique constraint failed")
            ;(conflictError as unknown as { code: string }).code = "P2002"
            mockDb.product.create.mockRejectedValue(conflictError)

            const { createProduct } = await import("./products")
            const result = await createProduct(validProductInput)

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.code).toBe("CONFLICT")
                expect(result.error).toContain("SKU")
            }
        })
    })

    // ── updateProduct ───────────────────────────────────────────────────

    describe("updateProduct", () => {
        it("should update a product successfully", async () => {
            mockDb.product.updateMany.mockResolvedValue({ count: 1 })

            const { updateProduct } = await import("./products")
            const result = await updateProduct({ id: "prod-1", ...validProductInput })

            expect(result.ok).toBe(true)
            expect(mockDb.product.updateMany).toHaveBeenCalledWith({
                where: { id: "prod-1" },
                data: expect.objectContaining({ name: "Wireless Mouse" }),
            })
        })

        it("should return not-found when product does not exist", async () => {
            mockDb.product.updateMany.mockResolvedValue({ count: 0 })

            const { updateProduct } = await import("./products")
            const result = await updateProduct({ id: "nonexistent", ...validProductInput })

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.code).toBe("NOT_FOUND")
            }
        })

        it("should reject empty product id", async () => {
            const { updateProduct } = await import("./products")
            const result = await updateProduct({ id: "", ...validProductInput })

            expect(result.ok).toBe(false)
        })
    })

    // ── deleteProduct ───────────────────────────────────────────────────

    describe("deleteProduct", () => {
        it("should soft-delete a product successfully", async () => {
            mockDb.product.updateMany.mockResolvedValue({ count: 1 })

            const { deleteProduct } = await import("./products")
            const result = await deleteProduct({ id: "prod-1" })

            expect(result.ok).toBe(true)
            expect(mockDb.product.updateMany).toHaveBeenCalledWith({
                where: { id: "prod-1" },
                data: expect.objectContaining({ deletedAt: expect.any(Date) }),
            })
        })

        it("should return not-found when product does not exist", async () => {
            mockDb.product.updateMany.mockResolvedValue({ count: 0 })

            const { deleteProduct } = await import("./products")
            const result = await deleteProduct({ id: "nonexistent" })

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.code).toBe("NOT_FOUND")
            }
        })
    })

    // ── getProducts ─────────────────────────────────────────────────────

    describe("getProducts", () => {
        it("should return all products without pagination", async () => {
            mockDb.product.findMany.mockResolvedValue([mockProduct])

            const { getProducts } = await import("./products")
            const result = await getProducts()

            expect(Array.isArray(result)).toBe(true)
            expect(result).toHaveLength(1)
        })

        it("should return paginated results", async () => {
            mockDb.product.findMany.mockResolvedValue([mockProduct])
            mockDb.product.count.mockResolvedValue(1)

            const { getProducts } = await import("./products")
            const result = await getProducts({ page: 1, pageSize: 10 })

            expect(result).toHaveProperty("data")
            expect(result).toHaveProperty("total", 1)
            expect(result).toHaveProperty("page", 1)
            expect((result as { data: unknown[] }).data).toHaveLength(1)
        })

        it("should filter by search term", async () => {
            mockDb.product.findMany.mockResolvedValue([mockProduct])
            mockDb.product.count.mockResolvedValue(1)

            const { getProducts } = await import("./products")
            await getProducts({ page: 1, pageSize: 10, search: "Mouse" })

            expect(mockDb.product.findMany).toHaveBeenCalled()
        })
    })

    // ── getProductsStats ────────────────────────────────────────────────

    describe("getProductsStats", () => {
        it("should return aggregated stock statistics", async () => {
            mockDb.product.count.mockResolvedValueOnce(100)   // total
            mockDb.product.count.mockResolvedValueOnce(5)     // out-of-stock
            const { basePrisma } = await import("@/lib/prisma")
            vi.mocked(basePrisma.$queryRaw).mockResolvedValue([{ count: 10n }])

            const { getProductsStats } = await import("./products")
            const result = await getProductsStats()

            expect(result).toEqual({
                totalProducts: 100,
                inStock: 85,
                lowStock: 10,
                outOfStock: 5,
            })
        })

        it("should handle zero counts", async () => {
            mockDb.product.count.mockResolvedValue(0)
            const { basePrisma } = await import("@/lib/prisma")
            vi.mocked(basePrisma.$queryRaw).mockResolvedValue([{ count: 0n }])

            const { getProductsStats } = await import("./products")
            const result = await getProductsStats()

            expect(result).toEqual({
                totalProducts: 0,
                inStock: 0,
                lowStock: 0,
                outOfStock: 0,
            })
        })
    })

    // ── getProduct ──────────────────────────────────────────────────────

    describe("getProduct", () => {
        it("should return a single product with relations", async () => {
            mockDb.product.findFirst.mockResolvedValue({
                ...mockProduct,
                orderItems: [],
            })

            const { getProduct } = await import("./products")
            const result = await getProduct("prod-1")

            expect(result).toMatchObject({
                id: "prod-1",
                name: "Wireless Mouse",
            })
            expect(mockDb.product.findFirst).toHaveBeenCalledWith({
                where: { id: "prod-1" },
                include: { category: true, supplier: true, orderItems: { include: { order: true } } },
            })
        })

        it("should return null for non-existent product", async () => {
            mockDb.product.findFirst.mockResolvedValue(null)

            const { getProduct } = await import("./products")
            const result = await getProduct("nonexistent")

            expect(result).toBeNull()
        })
    })
})
