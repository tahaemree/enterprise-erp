import { describe, it, expect, vi } from "vitest"
import { z } from "zod"

// Mock next/headers to avoid "called outside a request scope" error
vi.mock("next/headers", () => ({
    headers: vi.fn(() =>
        Promise.resolve({
            get: vi.fn(() => "127.0.0.1"),
        })
    ),
}))

// Mock rate-limit to avoid DB dependency in tests
// Mock rate-limit to avoid DB dependency — use a simpler approach without spread
vi.mock("@/lib/rate-limit", () => ({
    checkApiRateLimit: vi.fn().mockResolvedValue(undefined),
}))
import {
    AppError,
    AuthenticationError,
    AuthorizationError,
    TenantInactiveError,
    ValidationError,
    NotFoundError,
    RateLimitError,
    ConflictError,
    isAppError,
    getErrorMessage,
    fromZodError,
    success,
    failure,
    executeAction,
} from "@/lib/errors"

describe("AppError", () => {
    it("should create with default values", () => {
        const error = new AppError("Test error")
        expect(error.message).toBe("Test error")
        expect(error.statusCode).toBe(500)
        expect(error.code).toBe("INTERNAL_ERROR")
        expect(error.name).toBe("AppError")
    })

    it("should create with custom status code and code", () => {
        const error = new AppError("Custom error", 418, "TEAPOT")
        expect(error.message).toBe("Custom error")
        expect(error.statusCode).toBe(418)
        expect(error.code).toBe("TEAPOT")
    })

    it("should include optional details", () => {
        const details = { field: "email", reason: "already exists" }
        const error = new AppError("Conflict", 409, "CONFLICT", details)
        expect(error.details).toEqual(details)
    })

    it("toJSON should return structured format", () => {
        const error = new AppError("Something went wrong", 400, "BAD_REQUEST", { field: "name" })
        const json = error.toJSON()
        expect(json.error.code).toBe("BAD_REQUEST")
        expect(json.error.message).toBe("Something went wrong")
        expect(json.error.statusCode).toBe(400)
        expect(json.error.details).toEqual({ field: "name" })
        // stack trace development ortamında gelir, production'da sızdırılmaz
        expect(json.error).toHaveProperty("stack")
    })

    it("toJSON should omit details when not present", () => {
        const error = new AppError("Simple error")
        const json = error.toJSON()
        expect(json.error).not.toHaveProperty("details")
    })
})

describe("AuthenticationError", () => {
    it("should have 401 status code", () => {
        const error = new AuthenticationError()
        expect(error.statusCode).toBe(401)
        expect(error.code).toBe("UNAUTHORIZED")
    })

    it("should use custom message", () => {
        const error = new AuthenticationError("Please log in")
        expect(error.message).toBe("Please log in")
    })
})

describe("AuthorizationError", () => {
    it("should have 403 status code", () => {
        const error = new AuthorizationError()
        expect(error.statusCode).toBe(403)
        expect(error.code).toBe("FORBIDDEN")
    })

    it("should include optional details", () => {
        const error = new AuthorizationError("Admin only", { userRole: "USER" })
        expect(error.details).toEqual({ userRole: "USER" })
    })
})

describe("TenantInactiveError", () => {
    it("should have 403 status code and TENANT_INACTIVE code", () => {
        const error = new TenantInactiveError()
        expect(error.statusCode).toBe(403)
        expect(error.code).toBe("TENANT_INACTIVE")
    })

    it("should use default message", () => {
        const error = new TenantInactiveError()
        expect(error.message).toBe("Tenant account is inactive")
    })
})

describe("ValidationError", () => {
    it("should have 422 status code", () => {
        const error = new ValidationError()
        expect(error.statusCode).toBe(422)
        expect(error.code).toBe("VALIDATION_ERROR")
    })

    it("should store field errors", () => {
        const fieldErrors = { email: ["Invalid email"], name: ["Required"] }
        const error = new ValidationError("Validation failed", fieldErrors)
        expect(error.fieldErrors).toEqual(fieldErrors)
    })

    it("should pass field errors as details", () => {
        const fieldErrors = { email: ["Invalid email"] }
        const error = new ValidationError("Validation failed", fieldErrors)
        expect(error.details).toEqual({ fields: fieldErrors })
    })
})

describe("NotFoundError", () => {
    it("should have 404 status code", () => {
        const error = new NotFoundError()
        expect(error.statusCode).toBe(404)
        expect(error.code).toBe("NOT_FOUND")
    })

    it("should include resource name in message", () => {
        const error = new NotFoundError("Product")
        expect(error.message).toBe("Product not found")
    })
})

describe("RateLimitError", () => {
    it("should have 429 status code", () => {
        const error = new RateLimitError()
        expect(error.statusCode).toBe(429)
        expect(error.code).toBe("RATE_LIMITED")
    })

    it("should include retry time in message", () => {
        const error = new RateLimitError(30)
        expect(error.message).toBe("Too many requests. Try again in 30 seconds.")
        expect(error.retryAfterSeconds).toBe(30)
    })
})

describe("ConflictError", () => {
    it("should have 409 status code", () => {
        const error = new ConflictError()
        expect(error.statusCode).toBe(409)
        expect(error.code).toBe("CONFLICT")
    })
})

describe("isAppError", () => {
    it("should return true for AppError instances", () => {
        expect(isAppError(new AppError("test"))).toBe(true)
        expect(isAppError(new AuthenticationError())).toBe(true)
        expect(isAppError(new RateLimitError())).toBe(true)
    })

    it("should return false for non-AppError", () => {
        expect(isAppError(new Error("test"))).toBe(false)
        expect(isAppError("string error")).toBe(false)
        expect(isAppError(null)).toBe(false)
        expect(isAppError(undefined)).toBe(false)
        expect(isAppError({ code: "ERROR" })).toBe(false)
    })
})

describe("getErrorMessage", () => {
    it("should return message from AppError", () => {
        expect(getErrorMessage(new AppError("app error"))).toBe("app error")
    })

    it("should return message from standard Error", () => {
        expect(getErrorMessage(new Error("standard error"))).toBe("standard error")
    })

    it("should convert non-Error to string", () => {
        expect(getErrorMessage("just a string")).toBe("just a string")
        expect(getErrorMessage(42)).toBe("42")
        expect(getErrorMessage(null)).toBe("null")
    })
})

describe("fromZodError", () => {
    it("should convert ZodError to ValidationError with field errors", () => {
        const schema = z.object({
            email: z.string().email("Invalid email"),
            name: z.string().min(1, "Name is required"),
        })

        const result = schema.safeParse({ email: "bad", name: "" })
        expect(result.success).toBe(false)
        if (!result.success) {
            const validationError = fromZodError(result.error)
            expect(validationError).toBeInstanceOf(ValidationError)
            expect(validationError.statusCode).toBe(422)
            expect(validationError.fieldErrors).toBeDefined()
            expect(validationError.fieldErrors!.email).toBeDefined()
            expect(validationError.fieldErrors!.name).toBeDefined()
        }
    })

    it("should handle empty ZodError gracefully", () => {
        const emptyZodError = new z.ZodError([])
        const validationError = fromZodError(emptyZodError)
        expect(validationError).toBeInstanceOf(ValidationError)
        expect(validationError.fieldErrors).toEqual({})
    })
})

describe("success", () => {
    it("should create a successful ActionResult with data", () => {
        const result = success({ id: "1", name: "Test" })
        expect(result).toEqual({ ok: true, data: { id: "1", name: "Test" } })
    })

    it("should create a successful ActionResult with void data", () => {
        const result = success(undefined)
        expect(result).toEqual({ ok: true, data: undefined })
    })

    it("should create a successful ActionResult with array data", () => {
        const result = success([1, 2, 3])
        expect(result).toEqual({ ok: true, data: [1, 2, 3] })
    })

    it("should type-check correctly", () => {
        const result = success("hello")
        // ok must be true when data is present
        if (result.ok) {
            expect(typeof result.data).toBe("string")
        }
    })
})

describe("failure", () => {
    it("should create a failure ActionResult with error message", () => {
        const result = failure("Something went wrong")
        expect(result).toEqual({ ok: false, error: "Something went wrong" })
    })

    it("should include optional code", () => {
        const result = failure("Not found", { code: "NOT_FOUND" })
        expect(result).toEqual({ ok: false, error: "Not found", code: "NOT_FOUND" })
    })

    it("should include optional fieldErrors for validation", () => {
        const result = failure("Validation failed", {
            fieldErrors: { email: ["Invalid format"] },
        })
        expect(result).toEqual({
            ok: false,
            error: "Validation failed",
            fieldErrors: { email: ["Invalid format"] },
        })
    })

    it("should include optional statusCode", () => {
        const result = failure("Conflict", { code: "CONFLICT", statusCode: 409 })
        expect(result).toEqual({
            ok: false,
            error: "Conflict",
            code: "CONFLICT",
            statusCode: 409,
        })
    })

    it("should combine all optional options", () => {
        const result = failure("Validation error", {
            code: "VALIDATION_ERROR",
            fieldErrors: { name: ["Required"] },
            statusCode: 422,
        })
        expect(result).toEqual({
            ok: false,
            error: "Validation error",
            code: "VALIDATION_ERROR",
            fieldErrors: { name: ["Required"] },
            statusCode: 422,
        })
    })

    it("should have never data type", () => {
        const result = failure("Error")
        // ok must be false, so accessing data should not be allowed
        if (!result.ok) {
            expect(result.error).toBe("Error")
        }
    })
})

describe("executeAction", () => {
    it("should return success when the function resolves", async () => {
        const result = await executeAction(async () => "success")
        expect(result).toEqual({ ok: true, data: "success" })
    })

    it("should return success with object data", async () => {
        const result = await executeAction(async () => ({ id: 1, name: "Test" }))
        expect(result).toEqual({ ok: true, data: { id: 1, name: "Test" } })
    })

    it("should handle AppError by returning failure ActionResult", async () => {
        const result = await executeAction(async () => {
            throw new NotFoundError("Product")
        })
        expect(result).toEqual({
            ok: false,
            error: "Product not found",
            code: "NOT_FOUND",
            statusCode: 404,
        })
    })

    it("should handle AuthenticationError", async () => {
        const result = await executeAction(async () => {
            throw new AuthenticationError("Please log in")
        })
        expect(result).toEqual({
            ok: false,
            error: "Please log in",
            code: "UNAUTHORIZED",
            statusCode: 401,
        })
    })

    it("should handle AuthorizationError with details", async () => {
        const result = await executeAction(async () => {
            throw new AuthorizationError("Admin only", { userRole: "USER" })
        })
        expect(result).toEqual({
            ok: false,
            error: "Admin only",
            code: "FORBIDDEN",
            statusCode: 403,
        })
    })

    it("should handle ValidationError with fieldErrors", async () => {
        const result = await executeAction(async () => {
            throw new ValidationError("Validation failed", {
                email: ["Invalid email"],
                name: ["Required"],
            })
        })
        expect(result).toEqual({
            ok: false,
            error: "Validation failed",
            code: "VALIDATION_ERROR",
            statusCode: 422,
            fieldErrors: {
                email: ["Invalid email"],
                name: ["Required"],
            },
        })
    })

    it("should handle ZodError with fieldErrors", async () => {
        const schema = z.object({
            email: z.string().email("Invalid email format"),
        })
        const result = await executeAction(async () => {
            schema.parse({ email: "bad" })
            return "unreachable"
        })
        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.code).toBe("VALIDATION_ERROR")
            expect(result.statusCode).toBe(422)
            expect(result.fieldErrors).toBeDefined()
            expect(result.fieldErrors!.email).toBeDefined()
            expect(result.fieldErrors!.email![0]).toContain("Invalid email")
        }
    })

    it("should handle ZodError with nested path", async () => {
        const schema = z.object({
            user: z.object({
                name: z.string().min(1, "Name is required"),
            }),
        })
        const result = await executeAction(async () => {
            schema.parse({ user: { name: "" } })
            return "unreachable"
        })
        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.fieldErrors).toBeDefined()
            expect(result.fieldErrors!["user.name"]).toBeDefined()
        }
    })

    it("should handle standard Error by returning generic failure", async () => {
        const result = await executeAction(async () => {
            throw new Error("Standard error message")
        })
        expect(result).toEqual({
            ok: false,
            error: "Standard error message",
            statusCode: 500,
            requestId: expect.any(String),
        })
    })

    it("should handle non-Error thrown values", async () => {
        const result = await executeAction(async () => {
            // Simulate throwing a non-Error value (e.g., a string)
            throw "string error"
        })
        expect(result).toEqual({
            ok: false,
            error: "An unexpected error occurred",
            statusCode: 500,
            requestId: expect.any(String),
        })
    })

    it("should handle null thrown values", async () => {
        const result = await executeAction(async () => {
            throw null
        })
        expect(result).toEqual({
            ok: false,
            error: "An unexpected error occurred",
            statusCode: 500,
            requestId: expect.any(String),
        })
    })

    it("should re-throw Next.js control-flow errors (redirect/notFound)", async () => {
        const redirectError = Object.assign(new Error("NEXT_REDIRECT"), {
            digest: "NEXT_REDIRECT;replace;/login;307;",
        })
        await expect(
            executeAction(async () => {
                throw redirectError
            })
        ).rejects.toBe(redirectError)
    })

    it("should NOT attach a requestId to expected 4xx domain errors", async () => {
        const result = await executeAction(async () => {
            throw new NotFoundError("Product")
        })
        expect(result).not.toHaveProperty("requestId")
    })

    it("should properly preserve types through the wrapper", async () => {
        const result = await executeAction(async () => ({
            items: ["a", "b"],
            total: 2,
        }))
        if (result.ok) {
            expect(result.data.items).toHaveLength(2)
            expect(result.data.total).toBe(2)
        }
    })

    it("should handle RateLimitError with retry time", async () => {
        const result = await executeAction(async () => {
            throw new RateLimitError(30)
        })
        expect(result).toEqual({
            ok: false,
            error: "Too many requests. Try again in 30 seconds.",
            code: "RATE_LIMITED",
            statusCode: 429,
        })
    })

    it("should handle TenantInactiveError", async () => {
        const result = await executeAction(async () => {
            throw new TenantInactiveError()
        })
        expect(result).toEqual({
            ok: false,
            error: "Tenant account is inactive",
            code: "TENANT_INACTIVE",
            statusCode: 403,
        })
    })

    it("should handle ConflictError", async () => {
        const result = await executeAction(async () => {
            throw new ConflictError("Email already in use")
        })
        expect(result).toEqual({
            ok: false,
            error: "Email already in use",
            code: "CONFLICT",
            statusCode: 409,
        })
    })
})
