/**
 * Integration Tests: Customers Module
 *
 * Tests the full customer server action pipeline with a real PostgreSQL database.
 * Covers: CRUD, tenant isolation, soft delete, validation, search/filter, auth.
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

// ─── Mock setup ─────────────────────────────────────────────────────────

const mockRequireAuth = vi.fn()
const mockRequireManager = vi.fn()

vi.mock("@/lib/auth-utils", () => ({
    requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
    requireManager: (...args: unknown[]) => mockRequireManager(...args),
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

describe("Customers Integration — CRUD Operations", () => {
    it("should create a customer with all required fields", async () => {
        const { createCustomer } = await import("../customers")
        const result = await createCustomer({
            firstName: "John",
            lastName: "Doe",
            email: `john.doe.${Date.now()}@test.com`,
            phone: "+90 555 123 4567",
            company: "Test Corp",
            status: "LEAD",
            source: "WEBSITE",
        })

        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.data.firstName).toBe("John")
            expect(result.data.lastName).toBe("Doe")
            expect(result.data.status).toBe("LEAD")
            expect(result.data.tenantId).toBe(ctx.tenantId)
            expect(result.data.deletedAt).toBeNull()

            // Clean up
            await prisma.customer.delete({ where: { id: result.data.id } })
        }
    })

    it("should reject duplicate email within same tenant", async () => {
        const { createCustomer } = await import("../customers")
        const email = `duplicate.${Date.now()}@test.com`

        const first = await createCustomer({
            firstName: "First",
            lastName: "User",
            email,
            status: "LEAD",
            source: "DIRECT",
        })
        expect(first.ok).toBe(true)

        const second = await createCustomer({
            firstName: "Second",
            lastName: "User",
            email,
            status: "LEAD",
            source: "DIRECT",
        })
        expect(second.ok).toBe(false)

        if (first.ok) {
            await prisma.customer.delete({ where: { id: first.data.id } })
        }
    })

    it("should accept different emails in same tenant", async () => {
        const { createCustomer } = await import("../customers")

        const first = await createCustomer({
            firstName: "Alice",
            lastName: "Smith",
            email: `alice.${Date.now()}@test.com`,
            status: "LEAD",
            source: "DIRECT",
        })
        expect(first.ok).toBe(true)

        const second = await createCustomer({
            firstName: "Bob",
            lastName: "Jones",
            email: `bob.${Date.now()}@test.com`,
            status: "LEAD",
            source: "DIRECT",
        })
        expect(second.ok).toBe(true)

        if (first.ok) await prisma.customer.delete({ where: { id: first.data.id } })
        if (second.ok) await prisma.customer.delete({ where: { id: second.data.id } })
    })

    it("should reject missing required fields", async () => {
        const { createCustomer } = await import("../customers")
        const result = await createCustomer({
            firstName: "",
            lastName: "",
            status: "LEAD",
            source: "DIRECT",
        })

        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.fieldErrors).toBeDefined()
        }
    })

    it("should read a customer by id", async () => {
        const customer = await prisma.customer.create({
            data: {
                firstName: "Read",
                lastName: "Test",
                email: `read.${Date.now()}@test.com`,
                status: "CUSTOMER",
                source: "WEBSITE",
                tenantId: ctx.tenantId,
            },
        })

        const { getCustomer } = await import("../customers")
        const result = await getCustomer(customer.id)

        expect(result).not.toBeNull()
        expect(result?.id).toBe(customer.id)
        expect(result?.firstName).toBe("Read")
        expect(result?.lastName).toBe("Test")

        await prisma.customer.delete({ where: { id: customer.id } })
    })

    it("should return null for non-existent customer", async () => {
        const { getCustomer } = await import("../customers")
        const result = await getCustomer("non-existent-customer-id")

        expect(result).toBeNull()
    })

    it("should list customers with search filter", async () => {
        await Promise.all([
            prisma.customer.create({
                data: { firstName: "Alpha", lastName: "Corp", email: `alpha.${Date.now()}@test.com`, status: "CUSTOMER", source: "DIRECT", company: "Alpha Inc.", tenantId: ctx.tenantId },
            }),
            prisma.customer.create({
                data: { firstName: "Beta", lastName: "Ltd", email: `beta.${Date.now()}@test.com`, status: "LEAD", source: "WEBSITE", company: "Beta Co.", tenantId: ctx.tenantId },
            }),
            prisma.customer.create({
                data: { firstName: "Gamma", lastName: "LLC", email: `gamma.${Date.now()}@test.com`, status: "LEAD", source: "REFERRAL", company: "Gamma Group", tenantId: ctx.tenantId },
            }),
        ])

        const { getCustomers } = await import("../customers")

        // getCustomers returns PaginatedResult (not ActionResult), so check data directly
        const result = await getCustomers({ search: "Alpha", page: 1, pageSize: 10 })

        expect(result.data).toBeDefined()
        const customers = result.data
        expect(customers.length).toBeGreaterThanOrEqual(1)
        // Should find by firstName or company
        const found = customers.some(
            (c: { firstName: string; company: string | null }) =>
                c.firstName.includes("Alpha") || c.company?.includes("Alpha")
        )
        expect(found).toBe(true)
    })

    it("should update a customer", async () => {
        const customer = await prisma.customer.create({
            data: {
                firstName: "Update",
                lastName: "Test",
                email: `update.${Date.now()}@test.com`,
                status: "LEAD",
                source: "COLD_CALL",
                tenantId: ctx.tenantId,
            },
        })

        const { updateCustomer } = await import("../customers")
        const result = await updateCustomer({
            id: customer.id,
            firstName: "Updated",
            lastName: "Name",
            email: `updated.${Date.now()}@test.com`,
            status: "QUALIFIED",
            source: "COLD_CALL",
        })

        expect(result.ok).toBe(true)

        const updated = await prisma.customer.findUnique({ where: { id: customer.id } })
        expect(updated?.firstName).toBe("Updated")
        expect(updated?.status).toBe("QUALIFIED")

        await prisma.customer.delete({ where: { id: customer.id } })
    })

    it("should soft-delete a customer", async () => {
        const customer = await prisma.customer.create({
            data: {
                firstName: "Delete",
                lastName: "Test",
                email: `delete.${Date.now()}@test.com`,
                status: "LEAD",
                source: "DIRECT",
                tenantId: ctx.tenantId,
            },
        })

        const { deleteCustomer } = await import("../customers")
        const result = await deleteCustomer({ id: customer.id })

        expect(result.ok).toBe(true)

        // Should not appear in normal queries
        const raw = await prisma.customer.findUnique({ where: { id: customer.id } })
        expect(raw?.deletedAt).not.toBeNull()

        // Hard delete cleanup
        await prisma.customer.delete({ where: { id: customer.id } })
    })

    it("should enforce tenant isolation", async () => {
        const customer = await prisma.customer.create({
            data: {
                firstName: "Isolation",
                lastName: "Test",
                email: `isolation.${Date.now()}@test.com`,
                status: "LEAD",
                source: "DIRECT",
                tenantId: ctx.tenantId,
            },
        })

        // Create customer in different tenant
        const otherTenant = await prisma.tenant.create({
            data: {
                name: "Other Tenant CRM",
                slug: `other-crm-${Date.now()}`,
                plan: "FREE",
                isActive: true,
            },
        })
        const otherCustomer = await prisma.customer.create({
            data: {
                firstName: "Other",
                lastName: "Tenant",
                email: `other.${Date.now()}@test.com`,
                status: "CUSTOMER",
                source: "DIRECT",
                tenantId: otherTenant.id,
            },
        })

        // The action (using getTenantPrisma with ctx.tenantId) should not see it
        const { getCustomer } = await import("../customers")
        const result = await getCustomer(otherCustomer.id)
        expect(result).toBeNull()

        // Clean up
        await prisma.customer.delete({ where: { id: customer.id } })
        await prisma.customer.delete({ where: { id: otherCustomer.id } })
        await prisma.tenant.delete({ where: { id: otherTenant.id } })
    })

    it("should track customer status transitions", async () => {
        const { createCustomer, updateCustomer } = await import("../customers")
        const created = await createCustomer({
            firstName: "Status",
            lastName: "Transition",
            email: `transition.${Date.now()}@test.com`,
            status: "LEAD",
            source: "WEBSITE",
        })
        expect(created.ok).toBe(true)

        // Transition LEAD → QUALIFIED → CUSTOMER
        if (created.ok) {
            const qualified = await updateCustomer({
                id: created.data.id,
                firstName: "Status",
                lastName: "Transition",
                email: created.data.email,
                status: "QUALIFIED",
                source: "WEBSITE",
            })
            expect(qualified.ok).toBe(true)

            const customer = await updateCustomer({
                id: created.data.id,
                firstName: "Status",
                lastName: "Transition",
                email: created.data.email,
                status: "CUSTOMER",
                source: "WEBSITE",
            })
            expect(customer.ok).toBe(true)

            const updated = await prisma.customer.findUnique({ where: { id: created.data.id } })
            expect(updated?.status).toBe("CUSTOMER")

            await prisma.customer.delete({ where: { id: created.data.id } })
        }
    })

    it("should reject non-MANAGER role for mutations", async () => {
        mockRequireManager.mockImplementationOnce(() => {
            throw new AuthorizationError("Insufficient permissions")
        })

        const { createCustomer } = await import("../customers")
        const result = await createCustomer({
            firstName: "Hacker",
            lastName: "User",
            email: `hacker.${Date.now()}@test.com`,
            status: "LEAD",
            source: "DIRECT",
        })

        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.code).toBe("FORBIDDEN")
        }
    })
})
