/**
 * Integration Tests: Products Module
 *
 * Tests the full product server action pipeline with a real PostgreSQL database.
 * Covers: CRUD, tenant isolation, soft delete, validation, role-based auth.
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

    // Set up auth mock to return our test user
    mockRequireAuth.mockResolvedValue({
        id: ctx.userId,
        email: `test-${ctx.tenantId}@test.com`,
        name: "Test Admin",
        role: "ADMIN",
        tenantId: ctx.tenantId,
        tenantName: "Test Tenant",
    })

    mockRequireManager.mockImplementation(() => {
        // No-op — test user is ADMIN
    })
})

afterAll(async () => {
    await cleanupTestData(ctx)
})

beforeEach(() => {
    vi.clearAllMocks()
    // Re-setup mocks after clear
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

describe("Products Integration — CRUD Operations", () => {
    it("should create a product with all required fields", async () => {
        const { createProduct } = await import("../products")
        const result = await createProduct({
            name: "Integration Test Product",
            sku: `INT-TEST-${Date.now()}`,
            price: 99.99,
            quantity: 10,
            minStock: 10,
            unit: "piece",
            isActive: true,
        })

        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.data.name).toBe("Integration Test Product")
            expect(result.data.sku).toContain("INT-TEST-")
            expect(Number(result.data.price)).toBe(99.99)
            expect(Number(result.data.quantity)).toBe(10)
            expect(result.data.tenantId).toBe(ctx.tenantId)
            expect(result.data.deletedAt).toBeNull()

            // Clean up
            await prisma.product.delete({ where: { id: result.data.id } })
        }
    })

    it("should reject duplicate SKU within same tenant", async () => {
        const { createProduct } = await import("../products")
        const sku = `DUP-SKU-${Date.now()}`

        // Create first product
        const first = await createProduct({
            name: "Original Product",
            sku,
            price: 50,
            quantity: 5,
            minStock: 10,
            unit: "piece",
            isActive: true,
        })
        expect(first.ok).toBe(true)

        // Try creating duplicate
        const second = await createProduct({
            name: "Duplicate Product",
            sku,
            price: 75,
            quantity: 3,
            minStock: 10,
            unit: "piece",
            isActive: true,
        })
        expect(second.ok).toBe(false)
        if (!second.ok) {
            expect(second.code).toBe("CONFLICT")
        }

        // Clean up
        if (first.ok) {
            await prisma.product.delete({ where: { id: first.data.id } })
        }
    })

    it("should reject missing required fields", async () => {
        const { createProduct } = await import("../products")
        const result = await createProduct({
            name: "",
            sku: "",
            price: 0,
            quantity: 0,
            unit: "piece",
        })

        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.fieldErrors).toBeDefined()
            expect(Object.keys(result.fieldErrors!).length).toBeGreaterThan(0)
        }
    })

    it("should read a product by id", async () => {
        // Create product directly
        const product = await prisma.product.create({
            data: {
                name: "Read Test Product",
                sku: `READ-TEST-${Date.now()}`,
                price: 29.99,
                quantity: 20,
                unit: "piece",
                tenantId: ctx.tenantId,
            },
        })

        const { getProduct } = await import("../products")
        const result = await getProduct(product.id)

        expect(result).not.toBeNull()
        expect(result?.id).toBe(product.id)
        expect(result?.name).toBe("Read Test Product")

        // Clean up
        await prisma.product.delete({ where: { id: product.id } })
    })

    it("should return null for non-existent product", async () => {
        const { getProduct } = await import("../products")
        const result = await getProduct("non-existent-id-12345")

        expect(result).toBeNull()
    })

    it("should list products with pagination", async () => {
        // Create 3 test products
        const created = await Promise.all([
            prisma.product.create({
                data: { name: "List Product A", sku: `LIST-A-${Date.now()}`, price: 10, quantity: 1, unit: "piece", tenantId: ctx.tenantId },
            }),
            prisma.product.create({
                data: { name: "List Product B", sku: `LIST-B-${Date.now()}`, price: 20, quantity: 2, unit: "piece", tenantId: ctx.tenantId },
            }),
            prisma.product.create({
                data: { name: "List Product C", sku: `LIST-C-${Date.now()}`, price: 30, quantity: 3, unit: "piece", tenantId: ctx.tenantId },
            }),
        ])

        const { getProducts } = await import("../products")
        const result = await getProducts({ page: 1, pageSize: 2 })

        expect(Array.isArray(result.data)).toBe(true)
        expect(result.data).toHaveLength(2)
        expect(result.total).toBeGreaterThanOrEqual(3)
        expect(result.hasMore).toBe(true)

        // Clean up
        await prisma.product.deleteMany({
            where: { id: { in: created.map(p => p.id) } },
        })
    })

    it("should update a product", async () => {
        const product = await prisma.product.create({
            data: {
                name: "Update Test Product",
                sku: `UPDATE-TEST-${Date.now()}`,
                price: 49.99,
                quantity: 15,
                unit: "piece",
                tenantId: ctx.tenantId,
            },
        })

        const { updateProduct } = await import("../products")
        const result = await updateProduct({
            id: product.id,
            name: "Updated Product Name",
            sku: product.sku, // Keep same SKU
            price: 59.99,
            quantity: 25,
            minStock: 10,
            unit: "piece",
            isActive: true,
        })

        expect(result.ok).toBe(true)

        // Verify in DB
        const updated = await prisma.product.findUnique({ where: { id: product.id } })
        expect(updated?.name).toBe("Updated Product Name")
        expect(Number(updated?.price)).toBe(59.99)
        expect(Number(updated?.quantity)).toBe(25)

        // Clean up
        await prisma.product.delete({ where: { id: product.id } })
    })

    it("should soft-delete a product", async () => {
        const product = await prisma.product.create({
            data: {
                name: "Delete Test Product",
                sku: `DELETE-TEST-${Date.now()}`,
                price: 39.99,
                quantity: 8,
                unit: "piece",
                tenantId: ctx.tenantId,
            },
        })

        const { deleteProduct } = await import("../products")
        const result = await deleteProduct({ id: product.id })

        expect(result.ok).toBe(true)

        // Verify soft delete — should not appear in normal queries
        const { getProducts } = await import("../products")
        const list = await getProducts()
        const found = Array.isArray(list)
            ? list.find(p => p.id === product.id)
            : (list as { data: Array<{ id: string }> }).data.find((p: { id: string }) => p.id === product.id)
        expect(found).toBeUndefined()

        // But should still exist in DB with deletedAt set
        const raw = await prisma.product.findUnique({ where: { id: product.id } })
        expect(raw).not.toBeNull()
        expect(raw?.deletedAt).not.toBeNull()

        // Hard delete for cleanup
        await prisma.product.delete({ where: { id: product.id } })
    })

    it("should enforce tenant isolation", async () => {
        // Create a product in our tenant
        const product = await prisma.product.create({
            data: {
                name: "Isolation Test Product",
                sku: `ISOLATION-${Date.now()}`,
                price: 15.99,
                quantity: 5,
                unit: "piece",
                tenantId: ctx.tenantId,
            },
        })

        // Create a product in a DIFFERENT tenant
        const otherTenant = await prisma.tenant.create({
            data: {
                name: "Other Tenant",
                slug: `other-${Date.now()}`,
                plan: "FREE",
                isActive: true,
            },
        })
        const otherProduct = await prisma.product.create({
            data: {
                name: "Other Tenant Product",
                sku: `OTHER-${Date.now()}`,
                price: 99.99,
                quantity: 99,
                unit: "piece",
                tenantId: otherTenant.id,
            },
        })

        // The action (which uses getTenantPrisma with ctx.tenantId)
        // should NOT be able to see the other tenant's product
        const { getProduct } = await import("../products")
        const result = await getProduct(otherProduct.id)

        // findUnique will return null because tenant isolation blocks cross-tenant access
        expect(result).toBeNull()

        // Clean up
        await prisma.product.delete({ where: { id: product.id } })
        await prisma.product.delete({ where: { id: otherProduct.id } })
        await prisma.tenant.delete({ where: { id: otherTenant.id } })
    })

    it("should reject non-MANAGER role for mutations", async () => {
        mockRequireManager.mockImplementationOnce(() => {
            throw new AuthorizationError("Insufficient permissions")
        })

        const { createProduct } = await import("../products")
        const result = await createProduct({
            name: "Unauthorized Product",
            sku: `UNAUTH-${Date.now()}`,
            price: 10,
            quantity: 1,
            minStock: 10,
            unit: "piece",
            isActive: true,
        })

        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.code).toBe("FORBIDDEN")
        }
    })
})
