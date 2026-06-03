import { describe, expect, it, vi, beforeEach } from "vitest"
import { z } from "zod"
import { validatedActionWithRole, withRole } from "@/lib/action-wrapper"
import { requireAdmin, requireAuth, requireManager } from "@/lib/auth-utils"

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
    getTenantPrisma: vi.fn(() => ({})),
}))

vi.mock("@/services/activity-log.service", () => ({
    activityLogService: { log: vi.fn() },
}))

vi.mock("@/lib/logger", () => ({
    default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

vi.mock("@/lib/auth-utils", async () => {
    const { AuthorizationError } = await vi.importActual<typeof import("@/lib/errors")>("@/lib/errors")
    return {
        requireAuth: vi.fn(),
        requireAdmin: vi.fn((user: { role: string }) => {
            if (user.role !== "ADMIN") throw new AuthorizationError("Insufficient permissions")
        }),
        requireManager: vi.fn((user: { role: string }) => {
            if (user.role !== "ADMIN" && user.role !== "MANAGER") {
                throw new AuthorizationError("Insufficient permissions")
            }
        }),
    }
})

const managerUser = {
    id: "user-1",
    email: "manager@example.com",
    name: "Manager",
    role: "MANAGER" as const,
    tenantId: "tenant-1",
    tenantName: "Tenant",
    permissions: [],
}

describe("action-wrapper role enforcement", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(requireAuth).mockResolvedValue(managerUser)
    })

    it("does not downgrade withRole('ADMIN') to manager access", async () => {
        const handler = vi.fn()
        const action = withRole("ADMIN", handler)

        const result = await action()

        expect(result.ok).toBe(false)
        expect(result).toMatchObject({ code: "FORBIDDEN", statusCode: 403 })
        expect(handler).not.toHaveBeenCalled()
        expect(requireAdmin).toHaveBeenCalledWith(managerUser)
        expect(requireManager).not.toHaveBeenCalled()
    })

    it("does not downgrade validatedActionWithRole('ADMIN') to manager access", async () => {
        const handler = vi.fn()
        const action = validatedActionWithRole(
            "ADMIN",
            z.object({ name: z.string() }),
            "USER",
            "/settings/permissions",
            handler
        )

        const result = await action({ name: "Test" })

        expect(result.ok).toBe(false)
        expect(result).toMatchObject({ code: "FORBIDDEN", statusCode: 403 })
        expect(handler).not.toHaveBeenCalled()
        expect(requireAdmin).toHaveBeenCalledWith(managerUser)
        expect(requireManager).not.toHaveBeenCalled()
    })

    it("keeps manager access for withRole('MANAGER')", async () => {
        const handler = vi.fn().mockResolvedValue("ok")
        const action = withRole("MANAGER", handler)

        const result = await action()

        expect(result).toEqual({ ok: true, data: "ok" })
        expect(handler).toHaveBeenCalled()
        expect(requireManager).toHaveBeenCalledWith(managerUser)
        expect(requireAdmin).not.toHaveBeenCalled()
    })
})
