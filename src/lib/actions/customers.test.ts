import { describe, it, expect, vi, beforeEach } from "vitest"
import { AuthorizationError } from "@/lib/errors"

// ─── Test Data ──────────────────────────────────────────────────────────

const mockUser = {
    id: "user-1",
    email: "admin@test.com",
    name: "Admin",
    role: "MANAGER" as const,
    tenantId: "tenant-1",
    tenantName: "Test Corp",
}

const mockCustomer = {
    id: "cust-1",
    firstName: "John",
    lastName: "Doe",
    email: "john@test.com",
    phone: "555-0100",
    company: "Acme Inc",
    jobTitle: "Engineer",
    address: "123 Main St",
    city: "Istanbul",
    state: "TR",
    country: "Turkey",
    postalCode: "34000",
    notes: "Test customer",
    source: "DIRECT" as const,
    status: "LEAD" as const,
    tags: [],
    tenantId: "tenant-1",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    deletedAt: null,
}

const validCustomerInput = {
    firstName: "John",
    lastName: "Doe",
    email: "john@test.com",
    phone: "555-0100",
    company: "Acme Inc",
    source: "DIRECT",
    status: "LEAD",
    tags: [],
}

// ─── Mocks ──────────────────────────────────────────────────────────────

const mockDb = {
    customer: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        updateMany: vi.fn(),
        count: vi.fn(),
        aggregate: vi.fn(),
        groupBy: vi.fn(),
    },
}

vi.mock("@/lib/prisma", () => ({
    getTenantPrisma: vi.fn(() => mockDb),
    isUniqueConstraintError: vi.fn(() => false),
    basePrisma: {},
    prisma: {},
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

describe("Customers — Server Actions", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ── createCustomer ──────────────────────────────────────────────────

    describe("createCustomer", () => {
        it("should create a customer successfully", async () => {
            mockDb.customer.create.mockResolvedValue(mockCustomer)

            const { createCustomer } = await import("./customers")
            const result = await createCustomer(validCustomerInput)

            expect(result.ok).toBe(true)
            if (result.ok) {
                expect(result.data).toMatchObject({
                    id: "cust-1",
                    firstName: "John",
                    lastName: "Doe",
                })
            }
            expect(mockDb.customer.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        firstName: "John",
                        tenantId: "tenant-1",
                    }),
                })
            )
        })

        it("should reject missing required fields", async () => {
            const { createCustomer } = await import("./customers")
            const result = await createCustomer({ firstName: "" })

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.error).toBeDefined()
                expect(result.fieldErrors).toBeDefined()
            }
            expect(mockDb.customer.create).not.toHaveBeenCalled()
        })

        it("should reject non-MANAGER role", async () => {
            mockRequireManager.mockImplementationOnce(() => {
                throw new AuthorizationError("Insufficient permissions")
            })

            const { createCustomer } = await import("./customers")
            const result = await createCustomer(validCustomerInput)

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.code).toBe("FORBIDDEN")
            }
            expect(mockDb.customer.create).not.toHaveBeenCalled()
        })

        it("should reject invalid email format", async () => {
            const { createCustomer } = await import("./customers")
            const result = await createCustomer({
                ...validCustomerInput,
                email: "not-an-email",
            })

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.fieldErrors).toBeDefined()
            }
        })
    })

    // ── updateCustomer ──────────────────────────────────────────────────

    describe("updateCustomer", () => {
        it("should update a customer successfully", async () => {
            mockDb.customer.updateMany.mockResolvedValue({ count: 1 })

            const { updateCustomer } = await import("./customers")
            const result = await updateCustomer({ id: "cust-1", ...validCustomerInput })

            expect(result.ok).toBe(true)
            expect(mockDb.customer.updateMany).toHaveBeenCalledWith({
                where: { id: "cust-1" },
                data: expect.objectContaining({ firstName: "John" }),
            })
        })

        it("should return not-found when customer does not exist", async () => {
            mockDb.customer.updateMany.mockResolvedValue({ count: 0 })

            const { updateCustomer } = await import("./customers")
            const result = await updateCustomer({ id: "nonexistent", ...validCustomerInput })

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.code).toBe("NOT_FOUND")
            }
        })

        it("should reject empty id", async () => {
            const { updateCustomer } = await import("./customers")
            const result = await updateCustomer({ id: "", ...validCustomerInput })

            expect(result.ok).toBe(false)
        })
    })

    // ── deleteCustomer ──────────────────────────────────────────────────

    describe("deleteCustomer", () => {
        it("should soft-delete a customer successfully", async () => {
            mockDb.customer.updateMany.mockResolvedValue({ count: 1 })

            const { deleteCustomer } = await import("./customers")
            const result = await deleteCustomer({ id: "cust-1" })

            expect(result.ok).toBe(true)
            expect(mockDb.customer.updateMany).toHaveBeenCalledWith({
                where: { id: "cust-1" },
                data: expect.objectContaining({ deletedAt: expect.any(Date) }),
            })
        })

        it("should return not-found when customer does not exist", async () => {
            mockDb.customer.updateMany.mockResolvedValue({ count: 0 })

            const { deleteCustomer } = await import("./customers")
            const result = await deleteCustomer({ id: "nonexistent" })

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.code).toBe("NOT_FOUND")
            }
        })
    })

    // ── getCustomers ────────────────────────────────────────────────────

    describe("getCustomers", () => {
        it("should return all customers without pagination", async () => {
            mockDb.customer.findMany.mockResolvedValue([mockCustomer])

            const { getCustomers } = await import("./customers")
            const result = await getCustomers()

            expect(Array.isArray(result)).toBe(true)
            expect(result).toHaveLength(1)
            expect(mockDb.customer.findMany).toHaveBeenCalled()
        })

        it("should return paginated results", async () => {
            mockDb.customer.findMany.mockResolvedValue([mockCustomer])
            mockDb.customer.count.mockResolvedValue(1)

            const { getCustomers } = await import("./customers")
            const result = await getCustomers({ page: 1, pageSize: 10 })

            expect(result).toHaveProperty("data")
            expect(result).toHaveProperty("total")
            expect(result).toHaveProperty("page", 1)
            expect((result as { data: unknown[] }).data).toHaveLength(1)
        })

        it("should filter by search term", async () => {
            mockDb.customer.findMany.mockResolvedValue([mockCustomer])
            mockDb.customer.count.mockResolvedValue(1)

            const { getCustomers } = await import("./customers")
            await getCustomers({ page: 1, pageSize: 10, search: "John" })

            expect(mockDb.customer.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        OR: expect.arrayContaining([
                            expect.objectContaining({ firstName: expect.objectContaining({ contains: "John" }) }),
                        ]),
                    }),
                })
            )
        })
    })

    // ── getCustomerMetrics ──────────────────────────────────────────────

    describe("getCustomerMetrics", () => {
        it("should return aggregated metrics", async () => {
            mockDb.customer.count.mockResolvedValueOnce(100)  // total
            mockDb.customer.count.mockResolvedValueOnce(50)   // active
            mockDb.customer.count.mockResolvedValueOnce(30)   // leads
            mockDb.customer.aggregate.mockResolvedValue({ _sum: { totalSpent: 50000 } })

            const { getCustomerMetrics } = await import("./customers")
            const result = await getCustomerMetrics()

            expect(result).toEqual({
                totalCustomers: 100,
                activeCustomers: 50,
                leads: 30,
                totalRevenue: 50000,
            })
        })

        it("should handle zero revenue gracefully", async () => {
            mockDb.customer.count.mockResolvedValue(0)
            mockDb.customer.aggregate.mockResolvedValue({ _sum: { totalSpent: null } })

            const { getCustomerMetrics } = await import("./customers")
            const result = await getCustomerMetrics()

            expect(result.totalRevenue).toBe(0)
        })
    })

    // ── getCustomer ─────────────────────────────────────────────────────

    describe("getCustomer", () => {
        it("should return a single customer with relations", async () => {
            mockDb.customer.findFirst.mockResolvedValue({
                ...mockCustomer,
                orders: [],
                interactions: [],
                customerAccount: null,
            })

            const { getCustomer } = await import("./customers")
            const result = await getCustomer("cust-1")

            expect(result).toMatchObject({
                id: "cust-1",
                firstName: "John",
            })
            expect(mockDb.customer.findFirst).toHaveBeenCalledWith({
                where: { id: "cust-1" },
                include: { orders: true, interactions: true, customerAccount: true },
            })
        })

        it("should return null for non-existent customer", async () => {
            mockDb.customer.findFirst.mockResolvedValue(null)

            const { getCustomer } = await import("./customers")
            const result = await getCustomer("nonexistent")

            expect(result).toBeNull()
        })
    })

    // ── getCustomersByStatus ────────────────────────────────────────────

    describe("getCustomersByStatus", () => {
        it("should return customers grouped by status", async () => {
            mockDb.customer.groupBy.mockResolvedValue([
                { status: "LEAD", _count: 30 },
                { status: "CUSTOMER", _count: 50 },
                { status: "CHURNED", _count: 20 },
            ])

            const { getCustomersByStatus } = await import("./customers")
            const result = await getCustomersByStatus()

            expect(result).toHaveLength(3)
            expect(mockDb.customer.groupBy).toHaveBeenCalledWith({
                by: ["status"],
                _count: true,
            })
        })
    })
})
