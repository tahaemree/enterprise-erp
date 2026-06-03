import NextAuth from "next-auth"
import authConfig from "../auth.config"
import createIntlMiddleware from "next-intl/middleware"
import { NextRequest, NextResponse } from "next/server"
import { routing } from "./i18n/routing"
import { REQUEST_ID_HEADER } from "./lib/request-context"

/**
 * Ensure the request carries a correlation id and echo it on the response so
 * clients (and logs) can reference a single id for the whole request.
 * Mutating the request headers means server components / actions read the same
 * id via `getRequestId()`.
 */
function withRequestId(req: NextRequest, res: Response | NextResponse | undefined) {
    const requestId = req.headers.get(REQUEST_ID_HEADER) ?? crypto.randomUUID()
    req.headers.set(REQUEST_ID_HEADER, requestId)
    if (res) res.headers.set(REQUEST_ID_HEADER, requestId)
    return res
}

const { auth } = NextAuth(authConfig)
const intlMiddleware = createIntlMiddleware(routing)

/**
 * Precomputed set of all public page paths with all locale prefixes.
 * This replaces the O(n) loop in isPublicPage() with an O(1) Set lookup.
 */
const PUBLIC_PAGES = new Set(["/", "/login"])
const localePrefixes = routing.locales.map((l) => `/${l}`)

// Precompute all locale-prefixed public paths into a single Set
const PUBLIC_PATHS = new Set<string>()
for (const prefix of localePrefixes) {
    for (const page of PUBLIC_PAGES) {
        PUBLIC_PATHS.add(`${prefix}${page === "/" ? "" : page}`)
    }
}

// Also add the unprefixed versions
for (const page of PUBLIC_PAGES) {
    PUBLIC_PATHS.add(page)
}

/**
 * Optimized proxy: single-pass auth + i18n handling.
 * Precomputed PUBLIC_PATHS Set enables O(1) public page lookups.
 */
const authMiddleware = auth((req) => {
    const { pathname } = req.nextUrl
    const isLoggedIn = !!req.auth

    // Allow API auth routes to pass through without i18n middleware
    if (pathname.startsWith("/api/auth")) {
        return
    }

    const isPublic = PUBLIC_PATHS.has(pathname) || PUBLIC_PATHS.has(pathname.replace(/\/$/, ""))

    if (isPublic) {
        // If logged in and trying to access login page, redirect to dashboard
        if (isLoggedIn && (pathname.endsWith("/login") || pathname.endsWith("/login/"))) {
            // Preserve the current locale
            const locale = localePrefixes.find((p) => pathname.startsWith(p))?.slice(1) || routing.defaultLocale
            return Response.redirect(new URL(`/${locale}/dashboard`, req.url))
        }
        return intlMiddleware(req)
    }

    // Protected route - require authentication
    if (!isLoggedIn) {
        const locale = localePrefixes.find((p) => pathname.startsWith(p))?.slice(1) || routing.defaultLocale
        return Response.redirect(new URL(`/${locale}/login`, req.url))
    }

    return intlMiddleware(req)
})

export async function proxy(req: NextRequest, _event: unknown) {
    // next-auth beta has a bug where it overrides redirect statuses (e.g. from 307 to 404)
    // Also, next-intl middleware might fail to redirect the root path if wrapped or matched strangely.
    // Manually redirect the root path to the default locale.
    if (req.nextUrl.pathname === "/") {
        return withRequestId(req, NextResponse.redirect(new URL(`/${routing.defaultLocale}`, req.url)))
    }

    const run = authMiddleware as (
        req: NextRequest,
        event: unknown
    ) => Response | NextResponse | void | Promise<Response | NextResponse | void>
    const result = await run(req, _event)

    // A void result means "continue" — materialize a NextResponse so the
    // correlation id is still echoed on the outgoing response.
    return withRequestId(req, result ?? NextResponse.next())
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
}
