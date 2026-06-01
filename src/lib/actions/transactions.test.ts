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

const mockTransaction = {
    id: "txn-1",
    type: "INCOME" as const,
    amount: 1500.00,
    description: "Sales revenue - Q1",
    category: "SALES",
    reference: "INV-2026-001",
    date: new Date("2026-01-15"),
    tenantId: "tenant-1",
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-01-15"),
    deletedAt: null,
}

const validTransactionInput = {
    type: "INCOME" as const,
    amount: 1500.00,
    description: "Sales revenue - Q1",
    category: "SALES",
    reference: "INV-2026-001",
    date: new Date("2026-01-15"),
}

// ─── Mocks ──────────────────────────────────────────────────────────────

const mockDb = {
    transaction: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        updateMany: vi.fn(),
        count: vi.fn(),
    },
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

describe("Transactions — Server Actions", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ── getTransactions ─────────────────────────────────────────────────

    describe("getTransactions", () => {
        it("should return all transactions without pagination", async () => {
            mockDb.transaction.findMany.mockResolvedValue([mockTransaction])

            const { getTransactions } = await import("./transactions")
            const result = await getTransactions()

            expect(Array.isArray(result)).toBe(true)
            expect(result).toHaveLength(1)
            expect(result[0]).toMatchObject({
                id: "txn-1",
                type: "INCOME",
            })
        })

        it("should return paginated results", async () => {
            mockDb.transaction.findMany.mockResolvedValue([mockTransaction])
            mockDb.transaction.count.mockResolvedValue(1)

            const { getTransactions } = await import("./transactions")
            const result = await getTransactions({ page: 1, pageSize: 10 })

            expect(result).toHaveProperty("data")
            expect(result).toHaveProperty("total", 1)
            expect(result).toHaveProperty("page", 1)
            expect((result as { data: unknown[] }).data).toHaveLength(1)
        })
    })

    // ── getTransaction ──────────────────────────────────────────────────

    describe("getTransaction", () => {
        it("should return a single transaction", async () => {
            mockDb.transaction.findFirst.mockResolvedValue(mockTransaction)

            const { getTransaction } = await import("./transactions")
            const result = await getTransaction("txn-1")

            expect(result).toMatchObject({
                id: "txn-1",
                description: "Sales revenue - Q1",
            })
            expect(mockDb.transaction.findFirst).toHaveBeenCalledWith({
                where: { id: "txn-1" },
            })
        })

        it("should return null for non-existent transaction", async () => {
            mockDb.transaction.findFirst.mockResolvedValue(null)

            const { getTransaction } = await import("./transactions")
            const result = await getTransaction("nonexistent")

            expect(result).toBeNull()
        })
    })

    // ── createTransaction ──────────────────────────────────────────────

    describe("createTransaction", () => {
        it("should create a transaction successfully", async () => {
            mockDb.transaction.create.mockResolvedValue(mockTransaction)

            const { createTransaction } = await import("./transactions")
            const result = await createTransaction(validTransactionInput)

            expect(result.ok).toBe(true)
            if (result.ok) {
                expect(result.data).toMatchObject({
                    id: "txn-1",
                    type: "INCOME",
                    amount: 1500.00,
                })
            }
            expect(mockDb.transaction.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        type: "INCOME",
                        tenantId: "tenant-1",
                    }),
                })
            )
        })

        it("should reject missing required fields", async () => {
            const { createTransaction } = await import("./transactions")
            const result = await createTransaction({ type: "INCOME", description: "", amount: 0, date: new Date() })

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.fieldErrors).toBeDefined()
            }
            expect(mockDb.transaction.create).not.toHaveBeenCalled()
        })

        it("should reject negative amount", async () => {
            const { createTransaction } = await import("./transactions")
            const result = await createTransaction({
                ...validTransactionInput,
                amount: -50,
            })

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.fieldErrors).toBeDefined()
            }
        })

        it("should reject amount below minimum (0.01)", async () => {
            const { createTransaction } = await import("./transactions")
            const result = await createTransaction({
                ...validTransactionInput,
                amount: 0.001,
            })

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.fieldErrors).toBeDefined()
            }
        })

        it("should reject non-MANAGER role", async () => {
            const { AuthorizationError } = await import("@/lib/errors")
            mockRequireManager.mockImplementationOnce(() => {
                throw new AuthorizationError("Insufficient permissions")
            })

            const { createTransaction } = await import("./transactions")
            const result = await createTransaction(validTransactionInput)

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.code).toBe("FORBIDDEN")
            }
            expect(mockDb.transaction.create).not.toHaveBeenCalled()
        })
    })

    // ── updateTransaction ──────────────────────────────────────────────

    describe("updateTransaction", () => {
        it("should update a transaction successfully", async () => {
            mockDb.transaction.updateMany.mockResolvedValue({ count: 1 })

            const { updateTransaction } = await import("./transactions")
            const result = await updateTransaction({ id: "txn-1", ...validTransactionInput })

            expect(result.ok).toBe(true)
            expect(mockDb.transaction.updateMany).toHaveBeenCalledWith({
                where: { id: "txn-1" },
                data: expect.objectContaining({ type: "INCOME" }),
            })
        })

        it("should return not-found when transaction does not exist", async () => {
            mockDb.transaction.updateMany.mockResolvedValue({ count: 0 })

            const { updateTransaction } = await import("./transactions")
            const result = await updateTransaction({ id: "nonexistent", ...validTransactionInput })

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.code).toBe("NOT_FOUND")
            }
        })
    })

    // ── deleteTransaction ──────────────────────────────────────────────

    describe("deleteTransaction", () => {
        it("should soft-delete a transaction successfully", async () => {
            mockDb.transaction.updateMany.mockResolvedValue({ count: 1 })

            const { deleteTransaction } = await import("./transactions")
            const result = await deleteTransaction({ id: "txn-1" })

            expect(result.ok).toBe(true)
            expect(mockDb.transaction.updateMany).toHaveBeenCalledWith({
                where: { id: "txn-1" },
                data: expect.objectContaining({ deletedAt: expect.any(Date) }),
            })
        })

        it("should succeed even if transaction does not exist (no not-found check)", async () => {
            mockDb.transaction.updateMany.mockResolvedValue({ count: 0 })

            const { deleteTransaction } = await import("./transactions")
            const result = await deleteTransaction({ id: "nonexistent" })

            // Note: deleteTransaction does not throw on count === 0
            expect(result.ok).toBe(true)
        })
    })
})
