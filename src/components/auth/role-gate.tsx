import type { ReactNode } from "react"
import type { UserRole } from "@prisma/client"
import { requireAuth, hasRole, can } from "@/lib/auth-utils"

/**
 * Server-side UI authorization gate.
 *
 * Renders `children` only when the current user satisfies the required role
 * (by hierarchy) and/or permission; otherwise renders `fallback` (nothing by
 * default). This keeps action buttons (New / Edit / Delete) consistent with the
 * server-side enforcement in the action wrappers — the server is still the
 * source of truth, this just avoids showing controls that would 403.
 *
 * @example
 *   <RoleGate allow={["ADMIN", "MANAGER"]}>
 *     <Button asChild><Link href="/inventory/products/new">New</Link></Button>
 *   </RoleGate>
 */
export async function RoleGate({
    allow,
    permission,
    children,
    fallback = null,
}: {
    /** Roles allowed to see the content (hierarchy-aware). Omit to allow any. */
    allow?: UserRole | UserRole[]
    /** Optional granular permission requirement (e.g. "finance:write"). */
    permission?: string
    children: ReactNode
    fallback?: ReactNode
}) {
    const user = await requireAuth()

    const roles = allow === undefined ? [] : Array.isArray(allow) ? allow : [allow]
    const roleOk = hasRole(user, ...roles)
    const permissionOk = permission ? can(user, permission) : true

    return roleOk && permissionOk ? <>{children}</> : <>{fallback}</>
}
