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

const mockDepartment = {
    id: "dept-1",
    name: "Engineering",
    description: "Software engineering department",
    tenantId: "tenant-1",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
}

const mockEmployee = {
    id: "emp-1",
    employeeId: "EMP-001",
    firstName: "Ayşe",
    lastName: "Demir",
    email: "ayse.demir@test.com",
    phone: "555-0300",
    position: "Senior Developer",
    departmentId: "dept-1",
    status: "ACTIVE" as const,
    hireDate: new Date("2025-01-15"),
    salary: 50000,
    salaryType: "monthly" as const,
    employmentType: "FULL_TIME" as const,
    address: "Bağdat Cad. No:100",
    city: "İstanbul",
    state: "TR",
    country: "Turkey",
    postalCode: "34700",
    emergencyContact: "Mehmet Demir",
    emergencyPhone: "555-0301",
    bankName: "Ziraat Bankası",
    bankAccount: "TR12 3456 7890 1234 5678 9012",
    taxId: "1234567890",
    notes: "Test employee",
    tenantId: "tenant-1",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    deletedAt: null,
}

const validEmployeeInput = {
    employeeId: "EMP-001",
    firstName: "Ayşe",
    lastName: "Demir",
    email: "ayse.demir@test.com",
    position: "Senior Developer",
    status: "ACTIVE" as const,
    hireDate: new Date("2025-01-15"),
    employmentType: "FULL_TIME" as const,
    salaryType: "monthly" as const,
}

// ─── Mocks ──────────────────────────────────────────────────────────────

const mockDb = {
    employee: {
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

describe("Employees — Server Actions", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ── getEmployees ────────────────────────────────────────────────────

    describe("getEmployees", () => {
        it("should return all employees without pagination", async () => {
            mockDb.employee.findMany.mockResolvedValue([
                { ...mockEmployee, department: mockDepartment },
            ])

            const { getEmployees } = await import("./employees")
            const result = await getEmployees()

            expect(Array.isArray(result)).toBe(true)
            expect(result).toHaveLength(1)
            expect(result[0]).toMatchObject({
                id: "emp-1",
                firstName: "Ayşe",
                department: expect.objectContaining({ name: "Engineering" }),
            })
        })

        it("should return paginated results", async () => {
            mockDb.employee.findMany.mockResolvedValue([
                { ...mockEmployee, department: mockDepartment },
            ])
            mockDb.employee.count.mockResolvedValue(1)

            const { getEmployees } = await import("./employees")
            const result = await getEmployees({ page: 1, pageSize: 10 })

            expect(result).toHaveProperty("data")
            expect(result).toHaveProperty("total", 1)
            expect(result).toHaveProperty("page", 1)
            expect((result as { data: unknown[] }).data).toHaveLength(1)
        })
    })

    // ── getEmployee ─────────────────────────────────────────────────────

    describe("getEmployee", () => {
        it("should return a single employee with department and leave requests", async () => {
            mockDb.employee.findFirst.mockResolvedValue({
                ...mockEmployee,
                department: mockDepartment,
                leaveRequests: [],
            })

            const { getEmployee } = await import("./employees")
            const result = await getEmployee("emp-1")

            expect(result).toMatchObject({
                id: "emp-1",
                firstName: "Ayşe",
                lastName: "Demir",
            })
            expect(mockDb.employee.findFirst).toHaveBeenCalledWith({
                where: { id: "emp-1" },
                include: { department: true, leaveRequests: true },
            })
        })

        it("should return null for non-existent employee", async () => {
            mockDb.employee.findFirst.mockResolvedValue(null)

            const { getEmployee } = await import("./employees")
            const result = await getEmployee("nonexistent")

            expect(result).toBeNull()
        })
    })

    // ── createEmployee ──────────────────────────────────────────────────

    describe("createEmployee", () => {
        it("should create an employee successfully", async () => {
            mockDb.employee.create.mockResolvedValue({
                ...mockEmployee,
                department: mockDepartment,
            })

            const { createEmployee } = await import("./employees")
            const result = await createEmployee(validEmployeeInput)

            expect(result.ok).toBe(true)
            if (result.ok) {
                expect(result.data).toMatchObject({
                    id: "emp-1",
                    firstName: "Ayşe",
                    lastName: "Demir",
                })
            }
            expect(mockDb.employee.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        firstName: "Ayşe",
                        tenantId: "tenant-1",
                    }),
                })
            )
        })

        it("should reject missing required fields", async () => {
            const { createEmployee } = await import("./employees")
            const result = await createEmployee({
                firstName: "",
                lastName: "",
                email: "",
                position: "",
                employeeId: "",
                status: "ACTIVE",
                hireDate: new Date(),
                employmentType: "FULL_TIME",
                salaryType: "monthly",
            })

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.fieldErrors).toBeDefined()
            }
            expect(mockDb.employee.create).not.toHaveBeenCalled()
        })

        it("should reject invalid email format", async () => {
            const { createEmployee } = await import("./employees")
            const result = await createEmployee({
                ...validEmployeeInput,
                email: "not-an-email",
            })

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.fieldErrors).toBeDefined()
            }
        })

        it("should reject non-MANAGER role", async () => {
            mockRequireManager.mockImplementationOnce(() => {
                throw new AuthorizationError("Insufficient permissions")
            })

            const { createEmployee } = await import("./employees")
            const result = await createEmployee(validEmployeeInput)

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.code).toBe("FORBIDDEN")
            }
            expect(mockDb.employee.create).not.toHaveBeenCalled()
        })
    })

    // ── updateEmployee ──────────────────────────────────────────────────

    describe("updateEmployee", () => {
        it("should update an employee successfully", async () => {
            mockDb.employee.updateMany.mockResolvedValue({ count: 1 })

            const { updateEmployee } = await import("./employees")
            const result = await updateEmployee({ id: "emp-1", ...validEmployeeInput })

            expect(result.ok).toBe(true)
            expect(mockDb.employee.updateMany).toHaveBeenCalledWith({
                where: { id: "emp-1" },
                data: expect.objectContaining({ firstName: "Ayşe" }),
            })
        })

        it("should return not-found when employee does not exist", async () => {
            mockDb.employee.updateMany.mockResolvedValue({ count: 0 })

            const { updateEmployee } = await import("./employees")
            const result = await updateEmployee({ id: "nonexistent", ...validEmployeeInput })

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.code).toBe("NOT_FOUND")
            }
        })

        it("should reject empty id", async () => {
            const { updateEmployee } = await import("./employees")
            const result = await updateEmployee({ id: "", ...validEmployeeInput })

            expect(result.ok).toBe(false)
        })
    })

    // ── deleteEmployee ──────────────────────────────────────────────────

    describe("deleteEmployee", () => {
        it("should soft-delete an employee with TERMINATED status", async () => {
            mockDb.employee.updateMany.mockResolvedValue({ count: 1 })

            const { deleteEmployee } = await import("./employees")
            const result = await deleteEmployee({ id: "emp-1" })

            expect(result.ok).toBe(true)
            expect(mockDb.employee.updateMany).toHaveBeenCalledWith({
                where: { id: "emp-1" },
                data: expect.objectContaining({
                    deletedAt: expect.any(Date),
                    status: "TERMINATED",
                }),
            })
        })

        it("should return not-found when employee does not exist", async () => {
            mockDb.employee.updateMany.mockResolvedValue({ count: 0 })

            const { deleteEmployee } = await import("./employees")
            const result = await deleteEmployee({ id: "nonexistent" })

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.code).toBe("NOT_FOUND")
            }
        })

        it("should reject empty id", async () => {
            const { deleteEmployee } = await import("./employees")
            const result = await deleteEmployee({ id: "" })

            expect(result.ok).toBe(false)
        })
    })
})
