import { describe, it, expect, vi } from "vitest"
import {
    requireRole,
    requireAdmin,
    requireManager,
    verifyTenantAccess,
    hasRole,
    can,
} from "@/lib/auth-utils"
import { AuthorizationError } from "@/lib/errors"
import type { UserRole } from "@prisma/client"

// Mock logger
vi.mock("@/lib/logger", () => ({
    default: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}))

// Mock prisma — not needed for unit tests of pure functions
vi.mock("@/lib/prisma", () => ({
    prisma: {},
}))

// Mock auth — not needed for pure function tests
vi.mock("@/lib/auth", () => ({
    auth: vi.fn(),
}))

type MockUser = { role: UserRole }

describe("hasRole (non-throwing, hierarchy-aware)", () => {
    it("returns true when the user's role meets the requirement by hierarchy", () => {
        expect(hasRole({ role: "ADMIN" }, "MANAGER")).toBe(true)
        expect(hasRole({ role: "MANAGER" }, "MANAGER")).toBe(true)
        expect(hasRole({ role: "MANAGER" }, "USER")).toBe(true)
    })

    it("returns false when the user's role is below the requirement", () => {
        expect(hasRole({ role: "USER" }, "MANAGER")).toBe(false)
        expect(hasRole({ role: "VIEWER" }, "USER")).toBe(false)
    })

    it("returns true when no role is required", () => {
        expect(hasRole({ role: "VIEWER" })).toBe(true)
    })

    it("returns true if ANY of several required roles is satisfied", () => {
        expect(hasRole({ role: "MANAGER" }, "ADMIN", "MANAGER")).toBe(true)
    })
})

describe("can (non-throwing permission check)", () => {
    it("grants ADMIN everything regardless of explicit permissions", () => {
        expect(can({ role: "ADMIN", permissions: [] }, "finance:write")).toBe(true)
    })

    it("grants when the exact permission is present", () => {
        expect(can({ role: "USER", permissions: ["finance:write"] }, "finance:write")).toBe(true)
    })

    it("grants via module wildcard and global wildcard", () => {
        expect(can({ role: "USER", permissions: ["finance:all"] }, "finance:write")).toBe(true)
        expect(can({ role: "USER", permissions: ["all:all"] }, "crm:read")).toBe(true)
    })

    it("denies when the permission is missing", () => {
        expect(can({ role: "USER", permissions: ["crm:read"] }, "finance:write")).toBe(false)
        expect(can({ role: "VIEWER", permissions: [] }, "finance:write")).toBe(false)
    })
})

describe("requireRole", () => {
    it("should not throw when user has exactly the required role", () => {
        const user: MockUser = { role: "MANAGER" }
        expect(() => requireRole(user, "MANAGER")).not.toThrow()
    })

    it("should not throw when user has a higher role than required", () => {
        const user: MockUser = { role: "ADMIN" }
        expect(() => requireRole(user, "USER")).not.toThrow()
    })

    it("should throw AuthorizationError when user lacks required role", () => {
        const user: MockUser = { role: "VIEWER" }
        expect(() => requireRole(user, "USER")).toThrow(/This action requires/)
    })

    it("should accept multiple roles and not throw if any match", () => {
        const user: MockUser = { role: "MANAGER" }
        expect(() => requireRole(user, "ADMIN", "MANAGER")).not.toThrow()
        // MANAGER >= VIEWER (50 >= 1), so this should NOT throw
        expect(() => requireRole(user, "ADMIN", "VIEWER")).not.toThrow()
        // MANAGER < ADMIN only (50 < 100), this should throw
        expect(() => requireRole(user, "ADMIN")).toThrow()
    })

    it("should not throw if no roles are specified", () => {
        const user: MockUser = { role: "VIEWER" }
        expect(() => requireRole(user)).not.toThrow()
    })

    it("should respect role hierarchy (ADMIN >= MANAGER >= USER >= VIEWER)", () => {
        const admin: MockUser = { role: "ADMIN" }
        const manager: MockUser = { role: "MANAGER" }
        const user: MockUser = { role: "USER" }
        const viewer: MockUser = { role: "VIEWER" }

        // ADMIN can do everything
        expect(() => requireRole(admin, "VIEWER")).not.toThrow()
        expect(() => requireRole(admin, "USER")).not.toThrow()
        expect(() => requireRole(admin, "MANAGER")).not.toThrow()
        expect(() => requireRole(admin, "ADMIN")).not.toThrow()

        // MANAGER can do USER and VIEWER but not ADMIN
        expect(() => requireRole(manager, "VIEWER")).not.toThrow()
        expect(() => requireRole(manager, "USER")).not.toThrow()
        expect(() => requireRole(manager, "ADMIN")).toThrow()

        // USER can do VIEWER but not MANAGER or ADMIN
        expect(() => requireRole(user, "VIEWER")).not.toThrow()
        expect(() => requireRole(user, "USER")).not.toThrow()
        expect(() => requireRole(user, "MANAGER")).toThrow()
        expect(() => requireRole(user, "ADMIN")).toThrow()

        // VIEWER can only do VIEWER
        expect(() => requireRole(viewer, "VIEWER")).not.toThrow()
        expect(() => requireRole(viewer, "USER")).toThrow()
        expect(() => requireRole(viewer, "MANAGER")).toThrow()
        expect(() => requireRole(viewer, "ADMIN")).toThrow()
    })
})

describe("requireAdmin", () => {
    it("should not throw for ADMIN role", () => {
        expect(() => requireAdmin({ role: "ADMIN" })).not.toThrow()
    })

    it("should throw for non-ADMIN roles", () => {
        expect(() => requireAdmin({ role: "MANAGER" })).toThrow()
        expect(() => requireAdmin({ role: "USER" })).toThrow()
        expect(() => requireAdmin({ role: "VIEWER" })).toThrow()
    })
})

describe("requireManager", () => {
    it("should not throw for ADMIN and MANAGER roles", () => {
        expect(() => requireManager({ role: "ADMIN" })).not.toThrow()
        expect(() => requireManager({ role: "MANAGER" })).not.toThrow()
    })

    it("should throw for lower roles", () => {
        expect(() => requireManager({ role: "USER" })).toThrow()
        expect(() => requireManager({ role: "VIEWER" })).toThrow()
    })
})

describe("verifyTenantAccess", () => {
    it("should not throw when tenant IDs match", () => {
        expect(() => verifyTenantAccess("tenant-1", "tenant-1")).not.toThrow()
    })

    it("should throw AuthorizationError when tenant IDs mismatch", () => {
        expect(() => verifyTenantAccess("tenant-1", "tenant-2")).toThrow(AuthorizationError)
        expect(() => verifyTenantAccess("tenant-1", "tenant-2")).toThrow("Access to Resource denied")
    })

    it("should use custom resource name in error message", () => {
        expect(() => verifyTenantAccess("a", "b", "Customer")).toThrow(/Access to Customer denied/)
    })
})
