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

const mockSupplier = {
    id: "sup-1",
    name: "TechDistributor A.Ş.",
    contactName: "Ahmet Yılmaz",
    email: "ahmet@techdistributor.com",
    phone: "555-0200",
    address: "Teknoloji Cad. No:42",
    city: "İstanbul",
    state: "TR",
    country: "Turkey",
    postalCode: "34000",
    website: "https://techdistributor.com",
    notes: "Ana tedarikçi",
    paymentTerms: "30 days net",
    isActive: true,
    tenantId: "tenant-1",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    deletedAt: null,
}

const validSupplierInput = {
    name: "TechDistributor A.Ş.",
    contactName: "Ahmet Yılmaz",
    email: "ahmet@techdistributor.com",
    phone: "555-0200",
    notes: "Ana tedarikçi",
    isActive: true,
}

// ─── Mocks ──────────────────────────────────────────────────────────────

const mockDb = {
    supplier: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        updateMany: vi.fn(),
        count: vi.fn(),
    },
}

vi.mock("@/lib/prisma", () => ({
    getTenantPrisma: vi.fn(() => mockDb),
    basePrisma: {},
    isUniqueConstraintError: vi.fn(() => false),
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

describe("Suppliers — Server Actions", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ── getSuppliers ────────────────────────────────────────────────────

    describe("getSuppliers", () => {
        it("should return all suppliers without pagination", async () => {
            mockDb.supplier.findMany.mockResolvedValue([
                { ...mockSupplier, _count: { products: 5 } },
            ])

            const { getSuppliers } = await import("./suppliers")
            const result = await getSuppliers()

            expect(Array.isArray(result)).toBe(true)
            expect(result).toHaveLength(1)
            expect(result[0]).toMatchObject({
                id: "sup-1",
                name: "TechDistributor A.Ş.",
            })
            expect(mockDb.supplier.findMany).toHaveBeenCalled()
        })

        it("should return paginated results", async () => {
            mockDb.supplier.findMany.mockResolvedValue([
                { ...mockSupplier, _count: { products: 5 } },
            ])
            mockDb.supplier.count.mockResolvedValue(1)

            const { getSuppliers } = await import("./suppliers")
            const result = await getSuppliers({ page: 1, pageSize: 10 })

            expect(result).toHaveProperty("data")
            expect(result).toHaveProperty("total", 1)
            expect(result).toHaveProperty("page", 1)
            expect((result as { data: unknown[] }).data).toHaveLength(1)
        })
    })

    // ── getSupplier ─────────────────────────────────────────────────────

    describe("getSupplier", () => {
        it("should return a single supplier with products", async () => {
            mockDb.supplier.findFirst.mockResolvedValue({
                ...mockSupplier,
                products: [],
            })

            const { getSupplier } = await import("./suppliers")
            const result = await getSupplier("sup-1")

            expect(result).toMatchObject({
                id: "sup-1",
                name: "TechDistributor A.Ş.",
            })
            expect(mockDb.supplier.findFirst).toHaveBeenCalledWith({
                where: { id: "sup-1" },
                include: { products: { where: {} } },
            })
        })

        it("should return null for non-existent supplier", async () => {
            mockDb.supplier.findFirst.mockResolvedValue(null)

            const { getSupplier } = await import("./suppliers")
            const result = await getSupplier("nonexistent")

            expect(result).toBeNull()
        })
    })

    // ── createSupplier ──────────────────────────────────────────────────

    describe("createSupplier", () => {
        it("should create a supplier successfully", async () => {
            mockDb.supplier.create.mockResolvedValue(mockSupplier)

            const { createSupplier } = await import("./suppliers")
            const result = await createSupplier(validSupplierInput)

            expect(result.ok).toBe(true)
            if (result.ok) {
                expect(result.data).toMatchObject({
                    id: "sup-1",
                    name: "TechDistributor A.Ş.",
                })
            }
            expect(mockDb.supplier.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        name: "TechDistributor A.Ş.",
                        tenantId: "tenant-1",
                    }),
                })
            )
        })

        it("should reject missing required fields", async () => {
            const { createSupplier } = await import("./suppliers")
            const result = await createSupplier({ name: "" })

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.fieldErrors).toBeDefined()
            }
            expect(mockDb.supplier.create).not.toHaveBeenCalled()
        })

        it("should reject name shorter than 2 characters", async () => {
            const { createSupplier } = await import("./suppliers")
            const result = await createSupplier({ name: "A" })

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.fieldErrors).toBeDefined()
            }
        })

        it("should reject invalid email format", async () => {
            const { createSupplier } = await import("./suppliers")
            const result = await createSupplier({
                ...validSupplierInput,
                email: "not-an-email",
            })

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.fieldErrors).toBeDefined()
            }
        })
    })

    // ── updateSupplier ──────────────────────────────────────────────────

    describe("updateSupplier", () => {
        it("should update a supplier successfully", async () => {
            mockDb.supplier.updateMany.mockResolvedValue({ count: 1 })

            const { updateSupplier } = await import("./suppliers")
            const result = await updateSupplier({ id: "sup-1", ...validSupplierInput })

            expect(result.ok).toBe(true)
            expect(mockDb.supplier.updateMany).toHaveBeenCalledWith({
                where: { id: "sup-1" },
                data: expect.objectContaining({ name: "TechDistributor A.Ş." }),
            })
        })

        it("should return not-found when supplier does not exist", async () => {
            mockDb.supplier.updateMany.mockResolvedValue({ count: 0 })

            const { updateSupplier } = await import("./suppliers")
            const result = await updateSupplier({ id: "nonexistent", ...validSupplierInput })

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.code).toBe("NOT_FOUND")
            }
        })

        it("should reject empty id", async () => {
            const { updateSupplier } = await import("./suppliers")
            const result = await updateSupplier({ id: "", ...validSupplierInput })

            expect(result.ok).toBe(false)
        })
    })

    // ── deleteSupplier ──────────────────────────────────────────────────

    describe("deleteSupplier", () => {
        it("should soft-delete a supplier successfully", async () => {
            mockDb.supplier.updateMany.mockResolvedValue({ count: 1 })

            const { deleteSupplier } = await import("./suppliers")
            const result = await deleteSupplier({ id: "sup-1" })

            expect(result.ok).toBe(true)
            expect(mockDb.supplier.updateMany).toHaveBeenCalledWith({
                where: { id: "sup-1" },
                data: expect.objectContaining({ deletedAt: expect.any(Date) }),
            })
        })

        it("should return not-found when supplier does not exist", async () => {
            mockDb.supplier.updateMany.mockResolvedValue({ count: 0 })

            const { deleteSupplier } = await import("./suppliers")
            const result = await deleteSupplier({ id: "nonexistent" })

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.code).toBe("NOT_FOUND")
            }
        })
    })
})
