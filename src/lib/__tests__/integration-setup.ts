/**
 * Integration Test Setup
 *
 * Provides shared mock setup for all integration tests:
 * 1. Mocks Next.js dependencies (auth, cache, logger)
 * 2. Creates a reusable test context factory
 * 3. Cleans up test data between test files
 */

import { vi, beforeAll, afterAll } from "vitest"
import { PrismaClient } from "@prisma/client"

// ─── Types ───────────────────────────────────────────────────────────────

export interface TestContext {
    tenantId: string
    userId: string
    userEmail: string
}

// ─── Real DB Client for setup/teardown ──────────────────────────────────
// Use basePrisma directly to bypass tenant isolation during setup

const testPrisma = new PrismaClient({
    datasources: {
        db: { url: process.env.DATABASE_URL },
    },
})

// ─── Global Mock Setup ──────────────────────────────────────────────────

vi.mock("@/lib/auth", () => ({
    auth: vi.fn(),
}))

vi.mock("@/lib/logger", () => ({
    default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

vi.mock("next/navigation", () => ({
    redirect: vi.fn((url: string) => {
        throw new Error(`Redirect to ${url}`)
    }),
}))

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
    unstable_cache: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
}))

vi.mock("@/lib/rate-limit", () => ({
    checkRateLimit: vi.fn(() => ({ success: true })),
}))

// ─── Test Context Factory ────────────────────────────────────────────────

/**
 * Creates a fresh test context with a new tenant and user.
 * Returns the IDs needed for test actions.
 *
 * Call this in `beforeAll` of each test suite.
 */
export async function createTestContext(): Promise<TestContext> {
    const tenant = await testPrisma.tenant.create({
        data: {
            name: "Test Tenant",
            slug: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            plan: "PROFESSIONAL",
            isActive: true,
        },
    })

    const user = await testPrisma.user.create({
        data: {
            email: `test-${tenant.slug}@test.com`,
            name: "Test Admin",
            password: "hashed_password",
            role: "ADMIN",
            tenantId: tenant.id,
        },
    })

    return {
        tenantId: tenant.id,
        userId: user.id,
        userEmail: user.email,
    }
}

/**
 * Reads the test context from environment or creates a fresh one.
 * Useful for setup in beforeAll.
 */
export async function setupIntegrationTest(): Promise<{
    context: TestContext
    prisma: PrismaClient
}> {
    const context = await createTestContext()
    return { context, prisma: testPrisma }
}

/**
 * Cleans up all data created during integration tests.
 * Safely deletes all tenant-scoped records.
 */
export async function cleanupTestData(context: TestContext): Promise<void> {
    const { tenantId } = context

    // Delete in dependency order (children before parents)
    await testPrisma.accountEntryLine.deleteMany({
        where: { entry: { tenantId } },
    })
    await testPrisma.accountEntry.deleteMany({ where: { tenantId } })
    await testPrisma.customerAccount.deleteMany({ where: { tenantId } })
    await testPrisma.supplierAccount.deleteMany({ where: { tenantId } })
    await testPrisma.baBsFormItem.deleteMany({
        where: { form: { tenantId } },
    })
    await testPrisma.baBsForm.deleteMany({ where: { tenantId } })
    await testPrisma.eInvoice.deleteMany({ where: { tenantId } })
    await testPrisma.checkPromissoryNote.deleteMany({ where: { tenantId } })
    await testPrisma.currencyExchangeRate.deleteMany({
        where: { fromCurrency: { tenantId } },
    })
    await testPrisma.currency.deleteMany({ where: { tenantId } })
    await testPrisma.inflationCoefficient.deleteMany({ where: { tenantId } })
    await testPrisma.taxType.deleteMany({ where: { tenantId } })
    await testPrisma.orderItem.deleteMany({
        where: { order: { tenantId } },
    })
    await testPrisma.order.deleteMany({ where: { tenantId } })
    await testPrisma.transaction.deleteMany({ where: { tenantId } })
    await testPrisma.leaveRequest.deleteMany({ where: { tenantId } })
    await testPrisma.employee.deleteMany({ where: { tenantId } })
    await testPrisma.department.deleteMany({ where: { tenantId } })
    await testPrisma.interaction.deleteMany({ where: { tenantId } })
    await testPrisma.customer.deleteMany({ where: { tenantId } })
    await testPrisma.product.deleteMany({ where: { tenantId } })
    await testPrisma.supplier.deleteMany({ where: { tenantId } })
    await testPrisma.category.deleteMany({ where: { tenantId } })
    await testPrisma.costCenter.deleteMany({ where: { tenantId } })
    await testPrisma.bankAccount.deleteMany({ where: { tenantId } })
    await testPrisma.activityLog.deleteMany({ where: { tenantId } })
    await testPrisma.notification.deleteMany({ where: { tenantId } })
    await testPrisma.rateLimit.deleteMany({ where: { tenantId } })

    // Delete users and tenant
    await testPrisma.session.deleteMany({
        where: { user: { tenantId } },
    })
    await testPrisma.account.deleteMany({
        where: { user: { tenantId } },
    })
    await testPrisma.user.deleteMany({ where: { tenantId } })
    await testPrisma.tenant.deleteMany({ where: { id: tenantId } })
}

// ─── Export for test files ──────────────────────────────────────────────

export { testPrisma }
