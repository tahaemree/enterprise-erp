/**
 * Deftra — Base Action Wrapper
 *
 * Eliminates repetitive boilerplate across all server actions.
 * Provides consistent auth, DB context, validation, logging, and error handling.
 *
 * Usage:
 *
 *   // Simple read action
 *   export const getProducts = withAuth(async ({ user, db }) => {
 *     return db.product.findMany({ include: { category: true } })
 *   })
 *
 *   // Mutation with validation
 *   export const createProduct = withValidation(productSchema, (ctx) =>
 *     action("CREATE", "PRODUCT", "/inventory/products", async ({ user, db, parsed }) => {
 *       return db.product.create({ data: { ...parsed, tenantId: user.tenantId } })
 *     })
 *   )
 *
 *   // Mutation with role check
 *   export const deleteProduct = withRole("MANAGER", (ctx) =>
 *     action("DELETE", "PRODUCT", "/inventory/products", async ({ user, db }) => {
 *       await db.product.deleteMany({ where: { id } })
 *     })
 *   )
 */


import { type z } from "zod"
import { revalidatePath } from "next/cache"
import { getTenantPrisma } from "@/lib/prisma"
import { requireAdmin, requireAuth, requireManager, type AuthenticatedUser } from "@/lib/auth-utils"
import { executeAction, type ActionResult, fromZodError } from "@/lib/errors"
import logger from "@/lib/logger"
import { activityLogService, type EntityType, type LogAction } from "@/services/activity-log.service"

// ─── EntityType → ModuleName mapping ──────────────────────────────────

/**
 * Maps an EntityType to its corresponding MODULE constant for logger consistency.
 * This ensures log entries always use the canonical module name (hyphen-separated)
 * regardless of whether the caller passes an entity type in UPPER_SNAKE_CASE.
 */
function entityTypeToModule(entityType: EntityType): string {
    const mapping: Record<string, string> = {
        BANK_ACCOUNT: "bank-accounts",
        CHECK_NOTE: "check-notes",
        COST_CENTER: "cost-centers",
        LEAVE_REQUEST: "leave-requests",
        ACCOUNT_ENTRY: "account-entries",
        TAX_TYPE: "tax-types",
        EXCHANGE_RATE: "exchange-rates",
        EINVOICE: "e-invoice",
        BA_BS_FORM: "ba-bs-forms",
    }
    return mapping[entityType] ?? entityType.toLowerCase()
}

// ─── Types ───────────────────────────────────────────────────────────────

export interface ActionContext {
    user: AuthenticatedUser
    db: ReturnType<typeof getTenantPrisma>
}

export interface ValidatedContext<T> extends ActionContext {
    parsed: T
}

type ActionHandler<T> = (ctx: ActionContext) => Promise<T>
type ValidatedHandler<T, S> = (ctx: ValidatedContext<S>) => Promise<T>

type LogConfig = {
    action: LogAction
    entityType: EntityType
    entityId: string | (() => string)
    description: string | ((result: unknown) => string)
}

type RequiredRole = "MANAGER" | "ADMIN"

function enforceRole(user: Pick<AuthenticatedUser, "role">, role: RequiredRole): void {
    if (role === "ADMIN") {
        requireAdmin(user)
        return
    }
    requireManager(user)
}

// ─── Core Wrappers ───────────────────────────────────────────────────────

/**
 * Wraps an action handler with authentication, tenant-scoped Prisma client,
 * and standardized error handling (via executeAction).
 *
 * This is the most commonly used wrapper for all server actions.
 */
export function withAuth<T>(handler: ActionHandler<T>): () => Promise<ActionResult<T>> {
    return async () =>
        executeAction(async () => {
            const user = await requireAuth()
            const db = getTenantPrisma(user.tenantId)
            return handler({ user, db })
        })
}

/**
 * Same as withAuth, but also accepts arguments (for actions that take params like id, data).
 */
export function withAuthArgs<T, A extends unknown[]>(
    handler: (ctx: ActionContext, ...args: A) => Promise<T>
): (...args: A) => Promise<ActionResult<T>> {
    return async (...args: A) =>
        executeAction(async () => {
            const user = await requireAuth()
            const db = getTenantPrisma(user.tenantId)
            return handler({ user, db }, ...args)
        })
}

/**
 * Wraps an action with authentication AND role-based access control.
 * Requires MANAGER role or higher by default. Pass a custom role check function for complex scenarios.
 */
export function withRole<T>(
    role: RequiredRole,
    handler: ActionHandler<T>
): () => Promise<ActionResult<T>> {
    return async () =>
        executeAction(async () => {
            const user = await requireAuth()
            enforceRole(user, role)
            const db = getTenantPrisma(user.tenantId)
            return handler({ user, db })
        })
}

/**
 * Wraps an action with auth + role check + arguments support.
 */
export function withRoleArgs<T, A extends unknown[]>(
    role: RequiredRole,
    handler: (ctx: ActionContext, ...args: A) => Promise<T>
): (...args: A) => Promise<ActionResult<T>> {
    return async (...args: A) =>
        executeAction(async () => {
            const user = await requireAuth()
            enforceRole(user, role)
            const db = getTenantPrisma(user.tenantId)
            return handler({ user, db }, ...args)
        })
}

// ─── Validation Wrapper ──────────────────────────────────────────────────

/**
 * Wraps an action with auth + Zod validation.
 * Parses `data` using the provided schema and throws a structured ValidationError on failure.
 */
export function withValidation<T, S extends z.ZodType>(
    schema: S,
    handler: ValidatedHandler<T, z.infer<S>>
): (data: unknown) => Promise<ActionResult<T>> {
    return async (data: unknown) =>
        executeAction(async () => {
            const user = await requireAuth()
            const db = getTenantPrisma(user.tenantId)

            const parsed = schema.safeParse(data)
            if (!parsed.success) throw fromZodError(parsed.error)

            return handler({ user, db, parsed: parsed.data })
        })
}

/**
 * Wraps an action with auth + role check + Zod validation.
 */
export function withValidationAndRole<T, S extends z.ZodType>(
    role: RequiredRole,
    schema: S,
    handler: ValidatedHandler<T, z.infer<S>>
): (data: unknown) => Promise<ActionResult<T>> {
    return async (data: unknown) =>
        executeAction(async () => {
            const user = await requireAuth()
            enforceRole(user, role)
            const db = getTenantPrisma(user.tenantId)

            const parsed = schema.safeParse(data)
            if (!parsed.success) throw fromZodError(parsed.error)

            return handler({ user, db, parsed: parsed.data })
        })
}

// ─── Logging & Revalidation Helper ───────────────────────────────────────

/**
 * Logs an activity entry AND revalidates paths in one call.
 * This combines the two most common post-mutation operations.
 *
 * Usage:
 *   await logActivity(ctx.user, {
 *     action: "CREATE",
 *     entityType: "PRODUCT",
 *     entityId: product.id,
 *     description: `Created product: ${product.name}`,
 *   }, "/inventory/products")
 *
 * For multiple revalidation paths:
 *   await logActivity(ctx.user, config, ["/path1", "/path2"])
 */
export async function logActivity(
    user: AuthenticatedUser,
    config: LogConfig,
    revalidatePaths?: string | string[]
): Promise<void> {
    const entityId = typeof config.entityId === "function" ? config.entityId() : config.entityId

    await activityLogService.log(user.id, user.tenantId, {
        action: config.action,
        entityType: config.entityType,
        entityId,
        description: typeof config.description === "string" ? config.description : config.description(undefined),
    })

    if (revalidatePaths) {
        const paths = Array.isArray(revalidatePaths) ? revalidatePaths : [revalidatePaths]
        for (const path of paths) {
            revalidatePath(path)
        }
    }

    logger.info(`${config.action} ${config.entityType}`, {
        module: entityTypeToModule(config.entityType),
        userId: user.id,
        tenantId: user.tenantId,
        entityId,
    })
}

/**
 * Convenience: logActivity with a dynamic description based on the result.
 * Use this when you need to reference the created/updated entity in the description.
 */
export async function logActivityWithResult<T>(
    user: AuthenticatedUser,
    config: Omit<LogConfig, "description"> & { description: string | ((result: T) => string) },
    result: T,
    revalidatePaths?: string | string[]
): Promise<void> {
    const entityId = typeof config.entityId === "function" ? config.entityId() : config.entityId
    const description = typeof config.description === "function" ? config.description(result) : config.description

    await activityLogService.log(user.id, user.tenantId, {
        action: config.action,
        entityType: config.entityType,
        entityId,
        description,
    })

    if (revalidatePaths) {
        const paths = Array.isArray(revalidatePaths) ? revalidatePaths : [revalidatePaths]
        for (const path of paths) {
            revalidatePath(path)
        }
    }

    logger.info(`${config.action} ${config.entityType}`, {
        module: entityTypeToModule(config.entityType),
        userId: user.id,
        tenantId: user.tenantId,
        entityId,
    })
}

/**
 * Combinator: validates input, runs the handler, then logs + revalidates.
 * This is the ideal pattern for create/update actions.
 *
 * Usage:
 *   export const createProduct = validatedAction(productSchema, "PRODUCT", "/inventory/products",
 *     (ctx) => db.product.create({ data: { ...ctx.parsed, tenantId: ctx.user.tenantId } }),
 *     (parsed) => `Created product: ${parsed.sku}`
 *   )
 */
export function validatedAction<TRes, TSchema extends z.ZodType>(
    schema: TSchema,
    entityType: EntityType,
    revalidatePathArg: string,
    handler: (ctx: ValidatedContext<z.infer<TSchema>>) => Promise<TRes>,
    description: string | ((parsed: z.infer<TSchema>) => string) = `${entityType} action`,
    logAction: LogAction = "CREATE"
): (data: unknown) => Promise<ActionResult<TRes>> {
    return async (data: unknown) =>
        executeAction(async () => {
            const user = await requireAuth()
            const db = getTenantPrisma(user.tenantId)

            const parsed = schema.safeParse(data)
            if (!parsed.success) throw fromZodError(parsed.error)

            const result = await handler({ user, db, parsed: parsed.data })

            const desc = typeof description === "function" ? description(parsed.data) : description
            await activityLogService.log(user.id, user.tenantId, {
                action: logAction,
                entityType,
                entityId: (result as Record<string, unknown>)?.id as string ?? "unknown",
                description: desc,
            })

            logger.info(`${logAction} ${entityType}`, {
                module: entityTypeToModule(entityType),
                userId: user.id,
                tenantId: user.tenantId,
            })

            revalidatePath(revalidatePathArg)
            return result
        })
}

/**
 * Combinator: validates input, runs the handler (with role check), then logs + revalidates.
 */
export function validatedActionWithRole<TRes, TSchema extends z.ZodType>(
    role: RequiredRole,
    schema: TSchema,
    entityType: EntityType,
    revalidatePathArg: string,
    handler: (ctx: ValidatedContext<z.infer<TSchema>>) => Promise<TRes>,
    description: string | ((parsed: z.infer<TSchema>) => string) = `${entityType} action`,
    logAction: LogAction = "CREATE"
): (data: unknown) => Promise<ActionResult<TRes>> {
    return async (data: unknown) =>
        executeAction(async () => {
            const user = await requireAuth()
            enforceRole(user, role)
            const db = getTenantPrisma(user.tenantId)

            const parsed = schema.safeParse(data)
            if (!parsed.success) throw fromZodError(parsed.error)

            const result = await handler({ user, db, parsed: parsed.data })

            const desc = typeof description === "function" ? description(parsed.data) : description
            await activityLogService.log(user.id, user.tenantId, {
                action: logAction,
                entityType,
                entityId: (result as Record<string, unknown>)?.id as string ?? "unknown",
                description: desc,
            })

            logger.info(`${logAction} ${entityType}`, {
                module: entityTypeToModule(entityType),
                userId: user.id,
                tenantId: user.tenantId,
            })

            revalidatePath(revalidatePathArg)
            return result
        })
}
