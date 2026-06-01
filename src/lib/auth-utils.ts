/**
 * Deftra — Authentication & Authorization Utilities
 *
 * Provides server-side auth helpers for all server actions and API routes.
 * Handles: session validation, tenant active check, role-based authorization.
 */

import { cache } from "react"
import logger from "@/lib/logger"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
    AuthenticationError,
    AuthorizationError,
    TenantInactiveError,
} from "@/lib/errors"
import type { UserRole } from "@prisma/client"
import { ROLE_HIERARCHY } from "@/lib/constants"

// ─── Session & Tenant Validation ───────────────────────────────────────────

export interface AuthenticatedUser {
    id: string
    email: string
    name: string | null
    role: UserRole
    tenantId: string
    tenantName: string
    permissions: string[]
}

/**
 * Validates the current session and ensures the tenant is active.
 * This MUST be called at the start of every server action and API route.
 *
 * Memoized with React.cache() — within the same React server render pass,
 * multiple calls to requireAuth() will only hit the database ONCE.
 * This eliminates the N*2 DB round-trip problem on pages that call
 * multiple server actions/components.
 *
 * @returns AuthenticatedUser with validated session and tenant info
 * @throws AuthenticationError if not logged in
 * @throws TenantInactiveError if tenant is disabled
 */
export const requireAuth = cache(async function requireAuth(): Promise<AuthenticatedUser> {
    const session = await auth()

    if (!session?.user?.id || !session?.user?.tenantId) {
        redirect("/login")
    }

    // Verify tenant is still active (critical for multi-tenancy security)
    const tenant = await prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
        select: { id: true, isActive: true, plan: true, name: true },
    })

    if (!tenant) {
        redirect("/login")
    }

    if (!tenant.isActive) {
        logger.warn("Inactive tenant access attempt", {
            module: "auth-utils",
            tenantId: tenant.id,
            userId: session.user.id,
        })
        throw new TenantInactiveError(
            "Your account has been deactivated. Please contact your administrator."
        )
    }

    // tenantName is derived from Tenant.name (not stored on User model)
    return {
        id: session.user.id,
        email: session.user.email ?? "",
        name: session.user.name ?? null,
        role: session.user.role ?? "USER",
        tenantId: session.user.tenantId,
        tenantName: tenant.name,
        permissions: session.user.permissions ?? [],
    }
})

// ─── Role-Based Authorization ──────────────────────────────────────────────

// ROLE_HIERARCHY imported from @/lib/constants (single source of truth)

/**
 * Checks if the authenticated user has the required role or higher.
 * Uses role hierarchy: ADMIN > MANAGER > USER > VIEWER
 *
 * @param user - The authenticated user
 * @param requiredRoles - One or more roles that are allowed
 * @throws AuthorizationError if user lacks required role
 */
export function requireRole(
    user: Pick<AuthenticatedUser, "role">,
    ...requiredRoles: UserRole[]
): void {
    if (requiredRoles.length === 0) return

    const userLevel = ROLE_HIERARCHY[user.role] ?? 0

    // Check if user's role meets any of the required roles
    const hasAccess = requiredRoles.some((role) => {
        const requiredLevel = ROLE_HIERARCHY[role] ?? 0
        return userLevel >= requiredLevel
    })

    if (!hasAccess) {
        throw new AuthorizationError(
            `This action requires one of the following roles: ${requiredRoles.join(", ")}`,
            {
                userRole: user.role,
                requiredRoles,
            }
        )
    }
}

/**
 * Convenience: require ADMIN role
 */
export function requireAdmin(user: Pick<AuthenticatedUser, "role">): void {
    requireRole(user, "ADMIN")
}

/**
 * Convenience: require ADMIN or MANAGER role
 */
export function requireManager(user: Pick<AuthenticatedUser, "role">): void {
    requireRole(user, "ADMIN", "MANAGER")
}

// ─── Module-Based Authorization (Permissions) ──────────────────────────────

/**
 * Checks if the user has a specific permission.
 * ADMIN role automatically has all permissions.
 *
 * @param user - The authenticated user
 * @param requiredPermission - The permission string (e.g. 'finance:read')
 * @throws AuthorizationError if user lacks the permission
 */
export function requirePermission(
    user: Pick<AuthenticatedUser, "role" | "permissions">,
    requiredPermission: string
): void {
    // Admins bypass all granular permissions
    if (user.role === "ADMIN") return

    const hasPermission = user.permissions?.includes(requiredPermission)
    
    // Check for wildcard module access (e.g. 'finance:all')
    const [module] = requiredPermission.split(":")
    const hasWildcard = user.permissions?.includes(`${module}:all`) || user.permissions?.includes("all:all")

    if (!hasPermission && !hasWildcard) {
        throw new AuthorizationError(
            `You do not have the required permission (${requiredPermission}) to perform this action.`,
            {
                userRole: user.role,
                requiredPermission,
            }
        )
    }
}

// ─── Tenant Utility ────────────────────────────────────────────────────────

/**
 * Verify that a resource ID belongs to the current tenant.
 * This is a critical security check for multi-tenant data isolation.
 */
export function verifyTenantAccess(
    resourceTenantId: string,
    userTenantId: string,
    resourceName: string = "Resource"
): void {
    if (resourceTenantId !== userTenantId) {
        logger.warn("Cross-tenant access attempt detected", {
            module: "auth-utils",
            userTenantId,
            resourceTenantId,
            resourceName,
        })
        throw new AuthorizationError(`Access to ${resourceName} denied`)
    }
}
