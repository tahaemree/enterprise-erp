/**
 * Deftra — API CSRF Protection Middleware
 *
 * Provides CSRF (Cross-Site Request Forgery) protection for API routes
 * using the Double-Submit Cookie pattern:
 *
 * 1. On GET requests: Set a CSRF token cookie + return it in response headers
 * 2. On state-changing requests (POST, PUT, DELETE, PATCH):
 *    - Read token from X-CSRF-Token header
 *    - Read token from cookie
 *    - Compare: if they don't match, reject with 403
 *
 * For Server Actions, Next.js provides built-in CSRF protection.
 * This middleware is specifically for custom API routes.
 */

import { NextResponse, type NextRequest } from "next/server"
import { randomBytes } from "crypto"

const CSRF_COOKIE_NAME = "csrf-token"
const CSRF_HEADER_NAME = "x-csrf-token"
const CSRF_COOKIE_MAX_AGE = 60 * 60 * 2 // 2 hours

// Safe methods that don't need CSRF protection
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

/**
 * Generates a cryptographically secure random CSRF token
 */
function generateCsrfToken(): string {
    return randomBytes(32).toString("hex")
}

/**
 * Validates CSRF token from cookie against header
 */
function validateCsrfToken(request: NextRequest): boolean {
    const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
    const headerToken = request.headers.get(CSRF_HEADER_NAME)

    if (!cookieToken || !headerToken) {
        return false
    }

    // Constant-time comparison to prevent timing attacks
    if (cookieToken.length !== headerToken.length) {
        return false
    }

    let isValid = true
    for (let i = 0; i < cookieToken.length; i++) {
        if (cookieToken[i] !== headerToken[i]) {
            isValid = false
        }
    }

    return isValid
}

/**
 * CSRF protection middleware.
 *
 * Usage in API routes:
 *
 *   // app/api/example/route.ts
 *   import { csrfProtect } from "@/lib/api-middleware"
 *
 *   export async function POST(request: NextRequest) {
 *     const csrfResponse = await csrfProtect(request)
 *     if (csrfResponse) return csrfResponse  // 403 if CSRF fails
 *     // ... your handler logic
 *   }
 */
export async function csrfProtect(
    request: NextRequest
): Promise<NextResponse | null> {
    // Safe methods: no CSRF check needed
    if (SAFE_METHODS.has(request.method)) {
        // Set a new CSRF token cookie if one doesn't exist
        const existingToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
        if (!existingToken) {
            const response = NextResponse.next()
            response.cookies.set(CSRF_COOKIE_NAME, generateCsrfToken(), {
                httpOnly: false, // Must be readable by JS for double-submit pattern
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: CSRF_COOKIE_MAX_AGE,
                path: "/",
            })
            return null // Allow the request through
        }
        return null
    }

    // State-changing methods: validate CSRF token
    if (!validateCsrfToken(request)) {
        return NextResponse.json(
            {
                error: {
                    code: "CSRF_TOKEN_MISSING_OR_INVALID",
                    message: "CSRF token is missing or invalid. Refresh the page and try again.",
                    statusCode: 403,
                },
            },
            { status: 403 }
        )
    }

    return null // CSRF check passed
}
