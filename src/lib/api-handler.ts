/**
 * Deftra — Shared API Route Handler
 *
 * Eliminates repetitive try/catch boilerplate across all API routes.
 * Provides consistent error handling, auth checks, and response formatting.
 *
 * Usage:
 *   export const GET = apiHandler(async (request, { user, db }) => {
 *     const products = await db.product.findMany()
 *     return NextResponse.json(products)
 *   })
 *
 *   export const POST = apiHandler(async (request, { user, db }) => {
 *     requireManager(user)
 *     // ... create logic
 *     return NextResponse.json(result, { status: 201 })
 *   })
 */

import { NextRequest, NextResponse } from "next/server"
import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth, type AuthenticatedUser } from "@/lib/auth-utils"
import { isAppError, getErrorMessage, NotFoundError, fromZodError, RateLimitError } from "@/lib/errors"
import { checkApiRateLimit } from "@/lib/rate-limit"
import logger from "@/lib/logger"

type PrismaClientExtended = ReturnType<typeof getTenantPrisma>

export interface HandlerContext {
    user: AuthenticatedUser
    db: PrismaClientExtended
    request: NextRequest
    params?: Record<string, string>
}

type ApiHandlerFn = (context: HandlerContext) => Promise<NextResponse>

/**
 * Wraps an API GET/POST/PUT/DELETE handler with auth, error handling,
 * and tenant-scoped Prisma client.
 *
 * For routes WITHOUT dynamic params (e.g., /api/products):
 *   apiHandler(async ({ user, db }) => { ... })
 *
 * For routes WITH dynamic params (e.g., /api/products/[id]):
 *   apiHandler(async ({ user, db, params }) => { ... })
 */
export function apiHandler(handler: ApiHandlerFn) {
    return async (
        request: NextRequest,
        routeParams?: { params: Promise<Record<string, string>> }
    ): Promise<NextResponse> => {
        try {
            const user = await requireAuth()
            
            // Apply API Rate Limiting globally (100 req / minute per IP/Tenant)
            const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1"
            try {
                await checkApiRateLimit(ip, user.tenantId)
            } catch (err) {
                if (err instanceof Error && err.message.includes("rate limit")) {
                    throw new RateLimitError()
                }
                throw err
            }

            const db = getTenantPrisma(user.tenantId)

            const context: HandlerContext = {
                user,
                db,
                request,
            }

            if (routeParams?.params) {
                context.params = await routeParams.params
            }

            return handler(context)
        } catch (error) {
            return handleApiError(error, request)
        }
    }
}

/**
 * Consistent API error handling.
 * Converts AppError → structured JSON response with appropriate status code.
 * Logs unexpected errors and returns generic 500.
 */
function handleApiError(error: unknown, request: NextRequest): NextResponse {
    if (isAppError(error)) {
        // Log server errors (5xx), not client errors (4xx)
        if (error.statusCode >= 500) {
            logger.error("API server error", {
                module: "api",
                url: request.url,
                method: request.method,
                error: { message: error.message, code: error.code },
            })
        }
        return NextResponse.json(error.toJSON(), {
            status: error.statusCode,
        })
    }

    if (error instanceof SyntaxError) {
        // JSON parse error
        return NextResponse.json(
            { error: { code: "INVALID_JSON", message: "Invalid JSON in request body", statusCode: 400 } },
            { status: 400 }
        )
    }

    if (isZodError(error)) {
        // Zod validation error — return structured 400 with field-level errors
        return NextResponse.json(fromZodError(error as Parameters<typeof fromZodError>[0]).toJSON(), { status: 400 })
    }

    logger.error("API unhandled error", {
        module: "api",
        url: request.url,
        method: request.method,
        error: { message: getErrorMessage(error) },
    })

    return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Internal server error", statusCode: 500 } },
        { status: 500 }
    )
}

/**
 * Validates request body with a Zod schema and returns parsed data or error response.
 */
export async function parseBody<T>(
    request: NextRequest,
    schema: { safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: import("zod").ZodError } }
): Promise<{ parsed: T } | { response: NextResponse }> {
    try {
        const body = await request.json()
        const result = schema.safeParse(body)
        if (!result.success) {
            return { response: NextResponse.json(fromZodError(result.error).toJSON(), { status: 400 }) }
        }
        return { parsed: result.data }
    } catch {
        return { response: NextResponse.json({ error: { code: "INVALID_JSON", message: "Invalid JSON body", statusCode: 400 } }, { status: 400 }) }
    }
}

/**
 * Type guard to check if an error is a ZodError.
 * Uses duck-typing since ZodError may not be importable as a value type.
 */
function isZodError(error: unknown): error is { issues: Array<{ message: string; path: (string | number)[] }> } {
    return (
        typeof error === "object" &&
        error !== null &&
        "issues" in error &&
        Array.isArray((error as { issues: unknown }).issues)
    )
}

/**
 * Creates a 404 Not Found API response for any resource type.
 */
export function notFound(resource: string = "Resource"): NextResponse {
    return NextResponse.json(new NotFoundError(resource).toJSON(), { status: 404 })
}
