/**
 * Deftra — Application Error Hierarchy
 * Provides structured, typed errors with HTTP status codes
 * for consistent error handling across the application.
 */
export class AppError extends Error {
    public readonly statusCode: number
    public readonly code: string
    public readonly details?: Record<string, unknown>

    constructor(
        message: string,
        statusCode: number = 500,
        code: string = "INTERNAL_ERROR",
        details?: Record<string, unknown>
    ) {
        super(message)
        this.name = this.constructor.name
        this.statusCode = statusCode
        this.code = code
        this.details = details
        Error.captureStackTrace(this, this.constructor)
    }

    toJSON() {
        const payload: Record<string, unknown> = {
            code: this.code,
            message: this.message,
            statusCode: this.statusCode,
        }

        // Production'da asla stack trace veya internal detaylar sızdırılmaz
        if (process.env.NODE_ENV !== 'production') {
            if (this.details) {
                payload.details = this.details
            }
            if (this.stack) {
                payload.stack = this.stack
            }
        }

        return { error: payload }
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = "Authentication required") {
        super(message, 401, "UNAUTHORIZED")
    }
}

export class AuthorizationError extends AppError {
    constructor(
        message: string = "Insufficient permissions",
        details?: Record<string, unknown>
    ) {
        super(message, 403, "FORBIDDEN", details)
    }
}

export class TenantInactiveError extends AppError {
    constructor(message: string = "Tenant account is inactive") {
        super(message, 403, "TENANT_INACTIVE")
    }
}

export class ValidationError extends AppError {
    public readonly fieldErrors?: Record<string, string[]>

    constructor(
        message: string = "Validation failed",
        fieldErrors?: Record<string, string[]>
    ) {
        super(message, 422, "VALIDATION_ERROR", fieldErrors ? { fields: fieldErrors } : undefined)
        this.fieldErrors = fieldErrors
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string = "Resource") {
        super(`${resource} not found`, 404, "NOT_FOUND")
    }
}

export class RateLimitError extends AppError {
    constructor(
        public readonly retryAfterSeconds: number = 60
    ) {
        super(`Too many requests. Try again in ${retryAfterSeconds} seconds.`, 429, "RATE_LIMITED")
    }
}

export class ConflictError extends AppError {
    constructor(message: string = "Resource already exists") {
        super(message, 409, "CONFLICT")
    }
}

export class AuditTrailError extends AppError {
    constructor(message: string = "Audit trail records cannot be modified or deleted") {
        super(message, 403, "AUDIT_TRAIL_VIOLATION")
    }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
    return error instanceof AppError
}

/**
 * Safely extracts error message from any error type
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof AppError) return error.message
    if (error instanceof Error) return error.message
    return String(error)
}

/**
 * Parses a Zod error into a ValidationError
 */
export function fromZodError(error: import("zod").ZodError): ValidationError {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of error.issues) {
        const path = issue.path.join(".")
        if (!fieldErrors[path]) {
            fieldErrors[path] = []
        }
        fieldErrors[path].push(issue.message)
    }
    return new ValidationError("Validation failed", fieldErrors)
}

// ─── ActionResult Pattern ────────────────────────────────────────────────

/**
 * Standard response type for all server actions.
 * Provides consistent, type-safe returns across the entire application.
 *
 * @example
 * // Success
 * return { ok: true, data: user }
 *
 * // Error
 * return { ok: false, error: "User not found" }
 *
 * // Validation error with field-level details
 * return { ok: false, error: "Validation failed", fieldErrors: { email: ["Invalid format"] } }
 */
export type ActionResult<T = void> =
    | { ok: true; data: T }
    | { ok: false; error: string; code?: string; fieldErrors?: Record<string, string[]>; statusCode?: number }

/**
 * Wraps a successful result into ActionResult
 */
export function success<T>(data: T): ActionResult<T> {
    return { ok: true, data }
}

/**
 * Wraps an error into ActionResult
 */
export function failure(
    error: string,
    opts?: {
        code?: string
        fieldErrors?: Record<string, string[]>
        statusCode?: number
    }
): ActionResult<never> {
    return { ok: false, error, ...opts }
}

/**
 * Safely executes an action and wraps the result in ActionResult.
 * Catches AppError, ZodError, and generic errors.
 */
export async function executeAction<T>(
    fn: () => Promise<T>
): Promise<ActionResult<T>> {
    try {
        const data = await fn()
        return { ok: true, data }
    } catch (error) {
        if (error instanceof Error && (error.message.includes("rate limit") || error.message.includes("rate limit exceeded"))) {
            return { ok: false, error: "Too many requests. Please try again later.", statusCode: 429, code: "RATE_LIMITED" }
        }
        if (error instanceof AppError) {
            return {
                ok: false,
                error: error.message,
                code: error.code,
                statusCode: error.statusCode,
                ...(error instanceof ValidationError && error.fieldErrors
                    ? { fieldErrors: error.fieldErrors }
                    : {}),
            }
        }
        if (typeof error === "object" && error !== null && "issues" in error) {
            const zodError = error as import("zod").ZodError
            const ve = fromZodError(zodError)
            return {
                ok: false,
                error: ve.message,
                code: ve.code,
                statusCode: ve.statusCode,
                ...(ve.fieldErrors ? { fieldErrors: ve.fieldErrors } : {}),
            }
        }
        if (error instanceof Error) {
            return { ok: false, error: error.message, statusCode: 500 }
        }
        return { ok: false, error: "An unexpected error occurred", statusCode: 500 }
    }
}
